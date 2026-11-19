# SMART LIFE 8.0 CONNECT — Foundation

This package preserves the SMART LIFE 7.0.1 app source and adds the first cloud-backend setup files.
It is a foundation, not yet the finished online app or Android APK.

## Supabase browser configuration
1. Copy `public/supabase-config.example.js` to `public/supabase-config.js`.
2. Put your Project URL and `sb_publishable_...` key in that local file.
3. Never put an `sb_secret_...` or `service_role` key in `public/` or an APK.

## Database setup
1. Open Supabase Dashboard → SQL Editor → New query.
2. Paste and run `supabase/migrations/001_connect_schema.sql`.
3. Confirm tables exist in Table Editor.

## Safety defaults
- Profiles use display aliases; do not collect public real names, phone numbers, addresses, or school locations.
- New posts/comments are pending moderation; only approved posts/comments appear in the global feed.
- RLS is enabled on every table.
- Learning stats and XP ledger cannot be modified by browser clients.
- Do not add open private messaging in the initial release.

## Current status
The original 7.0.1 app remains intact. Authentication UI, global-feed UI, moderation tooling, deployment, and Capacitor APK packaging are subsequent implementation stages.
