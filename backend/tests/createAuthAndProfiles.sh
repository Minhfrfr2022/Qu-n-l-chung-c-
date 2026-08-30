#!/usr/bin/env bash
set -euo pipefail

# Creates auth users via Supabase Admin API, inserts profiles, and maps apartments.owner_id
# Requires: SUPABASE_URL and SERVICE_ROLE_KEY set in environment
# Requires: `curl` and `jq` installed

# If a backend/.env file exists, load it (simple KEY=VALUE pairs)
if [[ -f "$(dirname "$0")/../.env" ]]; then
  # shellcheck disable=SC1090
  set -o allexport
  # shellcheck source=/dev/null
  source "$(dirname "$0")/../.env"
  set +o allexport
  echo "Loaded environment from backend/.env"
fi

if [[ -z "${SUPABASE_URL:-}" || -z "${SERVICE_ROLE_KEY:-}" ]]; then
  echo "Please set SUPABASE_URL and SERVICE_ROLE_KEY environment variables or add them to backend/.env."
  echo "Example backend/.env contents:"
  echo "SUPABASE_URL=https://<your-project>.supabase.co"
  echo "SERVICE_ROLE_KEY=ey..."
  exit 1
fi

users=(
  "nguyenvan.a101@bluemoon.test:a101:Nguyễn Văn A:A101"
  "tranthi.a102@bluemoon.test:a102:Trần Thị B:A102"
  "lehong.b201@bluemoon.test:b201:Lê Hồng C:B201"
  "phamvan.b202@bluemoon.test:b202:Phạm Văn D:B202"
)

echo "Creating ${#users[@]} auth users and profiles..."

for u in "${users[@]}"; do
  IFS=":" read -r email username fullname apt <<< "$u"
  echo "-- Processing $email -> $apt"

  # Create auth user
  resp=$(curl -s -w "\n%{http_code}" -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"Test@1234\",\"email_confirm\":true,\"user_metadata\":{\"username\":\"${username}\",\"full_name\":\"${fullname}\",\"apartment_number\":\"${apt}\"}}")

  http=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')

  if [[ "$http" != "200" && "$http" != "201" ]]; then
    echo "Failed to create auth user $email (http $http):"
    echo "$body"
    continue
  fi

  # Extract user id (supports different Supabase response shapes)
  user_id=$(echo "$body" | jq -r '.id // .user.id // empty')
  if [[ -z "$user_id" ]]; then
    echo "Could not parse user id from response for $email:"; echo "$body"; continue
  fi
  echo "Created auth user id=$user_id"

  # Insert profile via REST
  profile_payload="[{\"id\":\"${user_id}\",\"username\":\"${username}\",\"full_name\":\"${fullname}\",\"email\":\"${email}\",\"role\":\"user\",\"apartment_number\":\"${apt}\"}]"
  prof_resp=$(curl -s -w "\n%{http_code}" -X POST "${SUPABASE_URL}/rest/v1/profiles" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates" \
    -d "$profile_payload")

  prof_http=$(echo "$prof_resp" | tail -n1)
  prof_body=$(echo "$prof_resp" | sed '$d')
  if [[ "$prof_http" != "201" && "$prof_http" != "200" ]]; then
    echo "Profile insert HTTP $prof_http for $email:"; echo "$prof_body"
  else
    echo "Inserted/updated profile for $email"
  fi

  # Patch apartments.owner_id where apt_id matches
  patch_resp=$(curl -s -w "\n%{http_code}" -X PATCH "${SUPABASE_URL}/rest/v1/apartments?apt_id=eq.${apt}" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "{\"owner_id\":\"${user_id}\"}")

  patch_http=$(echo "$patch_resp" | tail -n1)
  patch_body=$(echo "$patch_resp" | sed '$d')
  if [[ "$patch_http" == "204" || "$patch_http" == "200" ]]; then
    echo "Updated apartment ${apt} owner_id -> ${user_id}"
  else
    echo "Apartment patch response ($patch_http):"; echo "$patch_body"
  fi

  echo "----"
done

echo "Done."
