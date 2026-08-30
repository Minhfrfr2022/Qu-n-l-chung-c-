const { firebaseAdmin, isFirebaseConfigured } = require('../config/firebase');
const { supabaseAdmin } = require('../config/supabase');

const PRIORITY = {
  URGENT: 'urgent',       // Khẩn cấp (PCCC, bảo trì đột xuất) -> Bắt buộc Web Push + In-app
  IMPORTANT: 'important', // Quan trọng (Hóa đơn, thẻ xe) -> Web Push (theo cài đặt) + In-app
  NORMAL: 'normal',       // Thông thường (Bản tin, tin tức) -> Chỉ In-app Inbox (Không Push OS)
};

const CATEGORY = {
  BILLS: 'bills',
  VEHICLES: 'vehicles',
  VISITORS: 'visitors',
  ANNOUNCEMENTS: 'announcements',
  EMERGENCY: 'emergency',
};

/**
 * Xóa danh sách token hỏng/hết hạn khỏi DB
 */
async function pruneInvalidTokens(invalidTokens) {
  if (!invalidTokens || invalidTokens.length === 0) return;
  try {
    const { error } = await supabaseAdmin
      .from('user_fcm_tokens')
      .delete()
      .in('fcm_token', invalidTokens);

    if (error) {
      console.error('Error pruning invalid tokens:', error.message);
    } else {
      console.log(`Pruned ${invalidTokens.length} dead FCM token(s) from DB.`);
    }
  } catch (err) {
    console.error('pruneInvalidTokens error:', err);
  }
}

/**
 * Gửi Push Notification theo danh sách Token (tối đa 500 token/lô)
 */
async function sendMulticastBatch(tokens, { title, body, icon, link, data }) {
  if (!tokens || tokens.length === 0) return { successCount: 0, failureCount: 0 };

  if (!isFirebaseConfigured || !firebaseAdmin) {
    console.log(`[FCM Simulated] To ${tokens.length} token(s): "${title}" - ${body}`);
    return { successCount: tokens.length, failureCount: 0, simulated: true };
  }

  const message = {
    notification: {
      title,
      body,
    },
    data: {
      link: link || '/notifications',
      click_action: link || '/notifications',
      ...(data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {}),
    },
    webpush: {
      notification: {
        title,
        body,
        icon: icon || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        click_action: link || '/notifications',
      },
      fcmOptions: {
        link: link || '/notifications',
      },
    },
    tokens,
  };

  try {
    const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
    const deadTokens = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errCode = resp.error?.code;
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          deadTokens.push(tokens[idx]);
        }
      }
    });

    if (deadTokens.length > 0) {
      // Async clean up dead tokens
      pruneInvalidTokens(deadTokens).catch(console.error);
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('FCM sendMulticastBatch error:', error);
    return { successCount: 0, failureCount: tokens.length, error: error.message };
  }
}

/**
 * Gửi thông báo đến 1 User cụ thể:
 * 1. Lưu vào bảng notifications (Notification Inbox vĩnh viễn)
 * 2. Kiểm tra cài đặt thông báo của User
 * 3. Bắn Web Push nếu phù hợp mức ưu tiên
 */
async function sendPushToUser(userId, { type, title, message, link, metadata, category = CATEGORY.ANNOUNCEMENTS, priority = PRIORITY.IMPORTANT }) {
  try {
    // 1. Lưu vào Database (Notification Inbox)
    const { data: insertedNotif, error: dbError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type: type || 'info',
        title,
        message,
        link: link || null,
        metadata: metadata || null,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save notification to DB:', dbError.message);
    }

    // 2. Nếu mức ưu tiên là NORMAL -> Chỉ lưu Inbox, không Push OS (tránh spam)
    if (priority === PRIORITY.NORMAL) {
      return { success: true, inboxSaved: true, pushed: false };
    }

    // 3. Kiểm tra cài đặt thông báo của Cư dân (trừ khi là URGENT / EMERGENCY)
    if (priority !== PRIORITY.URGENT && category !== CATEGORY.EMERGENCY) {
      const { data: settings } = await supabaseAdmin
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (settings && settings[category] === false) {
        console.log(`User ${userId} opted out of ${category} push notifications.`);
        return { success: true, inboxSaved: true, pushed: false, reason: 'opt_out' };
      }
    }

    // 4. Lấy danh sách FCM tokens của user
    const { data: tokenRecords } = await supabaseAdmin
      .from('user_fcm_tokens')
      .select('fcm_token')
      .eq('user_id', userId);

    if (!tokenRecords || tokenRecords.length === 0) {
      return { success: true, inboxSaved: true, pushed: false, reason: 'no_tokens' };
    }

    const tokens = tokenRecords.map(r => r.fcm_token);

    // 5. Gửi Push qua FCM (Privacy-masked)
    const pushResult = await sendMulticastBatch(tokens, {
      title,
      body: message,
      link,
      data: {
        notificationId: insertedNotif?.id,
        category,
        priority,
      },
    });

    return { success: true, inboxSaved: true, pushed: true, pushResult };
  } catch (error) {
    console.error('sendPushToUser error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Gửi thông báo Broadcast đến toàn bộ cư dân hoặc nhóm:
 * Xử lý ngầm theo Batch (500 token/lần) không làm nghẽn backend
 */
async function sendPushToAll({ type, title, message, link, metadata, category = CATEGORY.ANNOUNCEMENTS, priority = PRIORITY.NORMAL }) {
  try {
    // 1. Lấy danh sách tất cả cư dân
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id');

    if (!profiles || profiles.length === 0) return { success: false, reason: 'no_users' };

    const userIds = profiles.map(p => p.id);

    // 2. Lưu vào DB theo lô (Inbox)
    const notificationsToInsert = userIds.map(uid => ({
      user_id: uid,
      type: type || 'info',
      title,
      message,
      link: link || null,
      metadata: metadata || null,
      read: false,
      created_at: new Date().toISOString(),
    }));

    // Insert chunks of 500 to DB
    for (let i = 0; i < notificationsToInsert.length; i += 500) {
      const chunk = notificationsToInsert.slice(i, i + 500);
      await supabaseAdmin.from('notifications').insert(chunk);
    }

    // 3. Nếu là NORMAL -> Không gửi Push OS
    if (priority === PRIORITY.NORMAL) {
      return { success: true, inboxCount: userIds.length, pushed: false };
    }

    // 4. Xử lý gửi FCM Push ngầm không chặn luồng
    setImmediate(async () => {
      try {
        const { data: tokenRecords } = await supabaseAdmin
          .from('user_fcm_tokens')
          .select('fcm_token');

        if (!tokenRecords || tokenRecords.length === 0) return;

        const allTokens = tokenRecords.map(r => r.fcm_token);

        // Gửi theo từng lô 500 token
        for (let i = 0; i < allTokens.length; i += 500) {
          const tokenBatch = allTokens.slice(i, i + 500);
          await sendMulticastBatch(tokenBatch, {
            title,
            body: message,
            link,
            data: { category, priority },
          });
        }
        console.log(`Broadcast push sent to ${allTokens.length} device tokens.`);
      } catch (err) {
        console.error('Async broadcast push error:', err);
      }
    });

    return { success: true, inboxCount: userIds.length, pushed: true };
  } catch (error) {
    console.error('sendPushToAll error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  PRIORITY,
  CATEGORY,
  sendPushToUser,
  sendPushToAll,
  sendMulticastBatch,
  pruneInvalidTokens,
};
