# QR-ATT — QR Attendance System

Expo / React Native application for student event attendance using QR codes and Supabase.

## Run the project

1. Install Node.js (LTS) and npm.
2. Copy `.env.example` to `.env`.
3. Fill in your existing Supabase project URL and publishable/anon key. Never put a service-role key in this app.
4. Run `npm install`.
5. Run `npx expo start` and open the app on your device or emulator.

## Main features

- Student registration and login, session persistence, and logout.
- Student profile and personal attendance history.
- Teacher event creation, editing, QR generation, attendance records, and summaries.
- Administrator user/event management and attendance record management.
- QR scan validation, open/closed event checks, event-time checks, and duplicate-attendance error handling.
- Midnight-plum, teal, and amber theme; the app icon uses the same theme and displays **GOMEZ**.

## Important implementation notes

- Public registration creates student accounts only. Teacher and administrator access should be granted through an authorized administrator/database process.
- QR attendance now looks up an existing event and rejects unknown QR payloads; scanning cannot create an event.
- Attendance checks the authenticated user ID and uses event dates/status fetched from Supabase rather than trusting dates embedded in a QR payload.
- Duplicate prevention must also be enforced in Supabase with a unique constraint on `(student_id, event_id)` and suitable Row Level Security policies. Keep your existing Supabase policies enabled and verify they enforce role-based access.
- The Supabase schema and policies are hosted in your project and are not included in this source ZIP. The client-side checks are not a substitute for database authorization.

## Final exam demonstration checklist

Demonstrate registration/login, role-based access, create/edit/close event, QR generation, successful scan, invalid QR, duplicate scan, closed event, attendance history, teacher summaries, admin controls, and logout. Explain each event as **Event → Handler → Action → Result**.
