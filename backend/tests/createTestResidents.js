const { supabaseAdmin } = require('../src/config/supabase');

async function createTestResidents() {
  const residents = [
    { email: 'nguyenvan.a101@bluemoon.test', password: 'Test@1234', username: 'a101', full_name: 'Nguyễn Văn A', apartment_number: 'A101', year_of_birth: 1985, hometown: 'Hà Nội', gender: 'male' },
    { email: 'tranthi.a102@bluemoon.test', password: 'Test@1234', username: 'a102', full_name: 'Trần Thị B', apartment_number: 'A102', year_of_birth: 1990, hometown: 'Hải Phòng', gender: 'female' },
    { email: 'lehong.b201@bluemoon.test', password: 'Test@1234', username: 'b201', full_name: 'Lê Hồng C', apartment_number: 'B201', year_of_birth: 1978, hometown: 'Đà Nẵng', gender: 'male' },
    { email: 'phamvan.b202@bluemoon.test', password: 'Test@1234', username: 'b202', full_name: 'Phạm Văn D', apartment_number: 'B202', year_of_birth: 1982, hometown: 'Hồ Chí Minh', gender: 'male' }
  ];

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. Aborting.');
    process.exit(1);
  }

        // Get existing auth users
        const { data: authListData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
        if (listErr) console.error('Failed to list auth users:', listErr.message || listErr);
        const existingAuthUsers = (authListData?.users || []).reduce((acc, u) => { if (u.email) acc[u.email.toLowerCase()] = u; return acc; }, {});

        // Get existing profiles for our emails
        const emails = residents.map(r => r.email.toLowerCase());
        const { data: existingProfiles = [], error: profilesErr } = await supabaseAdmin.from('profiles').select('id,email,apartment_number,username,full_name').in('email', emails);
        if (profilesErr) console.error('Failed to fetch existing profiles:', profilesErr.message || profilesErr);
        const profileByEmail = (existingProfiles || []).reduce((acc, p) => { if (p.email) acc[p.email.toLowerCase()] = p; return acc; }, {});

        // Get existing apartments
        const aptIds = residents.map(r => r.apartment_number);
        const { data: existingApts = [], error: aptErr } = await supabaseAdmin.from('apartments').select('id,apt_id').in('apt_id', aptIds);
        if (aptErr) console.error('Failed to fetch existing apartments:', aptErr.message || aptErr);
        const aptById = (existingApts || []).reduce((acc, a) => { if (a.apt_id) acc[a.apt_id] = a; return acc; }, {});

        for (const r of residents) {
          try {
            const emailKey = r.email.toLowerCase();

            // Create or skip auth user
            let userId;
            if (existingAuthUsers[emailKey]) {
              userId = existingAuthUsers[emailKey].id;
              console.log(`Auth user exists for ${r.email} (id=${userId})`);
            } else {
              const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: r.email,
                password: r.password,
                email_confirm: true,
                user_metadata: { username: r.username, full_name: r.full_name, apartment_number: r.apartment_number }
              });
              if (authError) { console.error(`Auth error for ${r.email}:`, authError.message || authError); continue; }
              userId = authData.user.id;
              console.log(`Created auth user ${r.email} (id=${userId})`);
            }

            // Upsert profile
            const existingProfile = profileByEmail[emailKey];
            if (existingProfile) {
              const updates = {};
              if (existingProfile.apartment_number !== r.apartment_number) updates.apartment_number = r.apartment_number;
              if (existingProfile.username !== r.username) updates.username = r.username;
              if (existingProfile.full_name !== r.full_name) updates.full_name = r.full_name;
              if (Object.keys(updates).length > 0) {
                const { error: updateErr } = await supabaseAdmin.from('profiles').update(updates).eq('id', existingProfile.id);
                if (updateErr) console.error(`Failed to update profile for ${r.email}:`, updateErr.message || updateErr);
                else console.log(`Updated profile for ${r.email}`);
              } else {
                console.log(`Profile exists for ${r.email} — no change.`);
              }
            } else {
              const { error: insertErr } = await supabaseAdmin.from('profiles').insert({ id: userId, username: r.username, full_name: r.full_name, email: r.email, role: 'user', apartment_number: r.apartment_number });
              if (insertErr) console.error(`Profile insert error for ${r.email}:`, insertErr.message || insertErr);
              else console.log(`Inserted profile for ${r.email}`);
            }

            // Upsert apartment basic record if table exists
            if (aptById[r.apartment_number]) {
              console.log(`Apartment ${r.apartment_number} exists — no change.`);
            } else {
              const aptData = { apt_id: r.apartment_number, owner_name: r.full_name, owner_email: r.email, status: 'occupied' };
              const { error: insertAptErr } = await supabaseAdmin.from('apartments').insert([aptData]);
              if (insertAptErr) console.error(`Apartment insert error for ${r.apartment_number}:`, insertAptErr.message || insertAptErr);
              else console.log(`Inserted apartment ${r.apartment_number}`);
            }

            // Ensure a residents row exists for this profile (optional)
            try {
              const { data: existingResidents = [], error: resErr } = await supabaseAdmin.from('residents').select('*').eq('email', r.email).eq('apt_id', r.apartment_number);
              if (resErr) console.error('Failed to check existing residents:', resErr.message || resErr);
              if (!existingResidents || existingResidents.length === 0) {
                const residentPayload = {
                  apt_id: r.apartment_number,
                  full_name: r.full_name,
                  email: r.email,
                  is_owner: true,
                  year_of_birth: r.year_of_birth || null,
                  hometown: r.hometown || null,
                  gender: r.gender || null,
                  created_at: new Date().toISOString()
                };
                const { error: insertResErr } = await supabaseAdmin.from('residents').insert([residentPayload]);
                if (insertResErr) console.error(`Resident insert error for ${r.email}:`, insertResErr.message || insertResErr);
                else console.log(`Inserted resident for ${r.email}`);
              } else {
                console.log(`Resident exists for ${r.email} — no change.`);
              }
            } catch (e) {
              console.error('Error ensuring resident row:', e.message || e);
            }

      } catch (err) {
        console.error(`Unexpected error for ${r.email}:`, err.message || err);
      }
    }
}

if (require.main === module) {
  createTestResidents().then(() => { console.log('Done creating/updating test residents.'); process.exit(0); }).catch(e => { console.error('Fatal:', e); process.exit(2); });
}

module.exports = { createTestResidents };
