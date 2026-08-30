require("dotenv").config({ path: ".env.local" });
const { supabaseAdmin } = require("../src/config/supabase");

async function createAdmin() {
  const email = "minh512@bluemoon.com";
  const password = "minh@512";
  const username = "admin";
  const full_name = "Minh512";

  console.log("Setting up admin account...");

  // 1. Tìm user đã tồn tại theo email (hoặc tạo mới nếu chưa có)
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error("List users error:", listError.message);
    return;
  }

  let userId;
  const existing = listData.users.find(u => u.email === email);

  if (existing) {
    userId = existing.id;
    console.log("Found existing Auth user:", userId);
  } else {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name, role: "admin" }
    });
    if (authError) {
      console.error("Auth error:", authError.message);
      return;
    }
    userId = authData.user.id;
    console.log("Auth user created:", userId);
  }

  // 2. Upsert profile với quyền admin
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: userId,
      username,
      full_name,
      email,
      role: "admin",
      apartment_number: null
    }, { onConflict: "id" });

  if (profileError) {
    console.error("Profile error:", profileError.message);
    return;
  }

  console.log("\n✅ ADMIN ACCOUNT IS READY!");
  console.log({ email, password, role: "admin" });
}

createAdmin();
