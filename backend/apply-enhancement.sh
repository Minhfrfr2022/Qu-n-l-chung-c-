#!/bin/bash

# Apply User-Resident-Apartment Enhancement
echo "🚀 Applying User-Resident-Apartment Enhancement..."

# Get Supabase connection details from environment or prompt
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "⚠️  SUPABASE_DB_URL not set"
  echo "Please set it or provide connection details:"
  read -p "Host: " DB_HOST
  read -p "Database: " DB_NAME
  read -p "User: " DB_USER
  
  CONNECTION_STRING="postgresql://${DB_USER}@${DB_HOST}/${DB_NAME}"
else
  CONNECTION_STRING="$SUPABASE_DB_URL"
fi

# Apply migration
echo "📦 Applying database migration..."
psql "$CONNECTION_STRING" -f "$(dirname "$0")/database/enhance_user_resident_constraints.sql"

if [ $? -eq 0 ]; then
  echo "✅ Migration applied successfully!"
  echo ""
  echo "📋 Summary of changes:"
  echo "  - Added user_id column to residents table"
  echo "  - Created unique constraint: 1 user = 1 resident max"
  echo "  - Added user_resident_info view"
  echo "  - Created auto-sync triggers for apartment_number"
  echo "  - Added validation triggers for owners"
  echo ""
  echo "🎉 Enhancement complete!"
else
  echo "❌ Migration failed. Please check errors above."
  exit 1
fi
