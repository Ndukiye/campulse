# CamPulse (Expo + Supabase)

A React Native (Expo) marketplace app tailored for students. Features profiles, listings, chat, reviews, favorites, notifications, and transactions. Supabase is used for database, Auth, and storage.

## Tech Stack

- **Expo SDK 54**, React Native 0.81
- **TypeScript** ~5.9
- **React Navigation 7** (stack + tabs)
- **Supabase JS v2** (`@supabase/supabase-js`)
- **AsyncStorage** for session persistence
- `react-native-url-polyfill` for Supabase URL polyfills

## Project Structure

```
campulse/
  App.tsx
  .env
  DATABASE_SCHEMA.md              # Full SQL schema (tables, RLS, triggers, storage policies)
  README.md                       # This file
  package.json
  src/
    context/
      AuthContext.tsx             # Auth context (mock → to be replaced by Supabase auth)
    lib/
      supabase.ts                 # Supabase client config
    navigation/
      AppNavigator.tsx
    screens/                      # UI screens
      AuthScreen.tsx              # Start integration here
      ProfileScreen.tsx
      BrowseScreen.tsx
      ListingDetailsScreen.tsx
      ...
    services/                     # (to be added) profile/transactions/etc. APIs
    types/
      database.ts                 # Types aligned with Supabase schema
      navigation.ts
    constants/
      categories.ts, products.ts  # Mock data (to be replaced)
```

## Getting Started

- Node 18+ recommended
- Install deps

```bash
npm install
```

- Start Expo

```bash
npm run start
```

## Environment Variables

Create/update `campulse/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Optional for development/testing flows
EXPO_PUBLIC_DEV_USER_ID=<uuid-of-an-existing-auth.users>
```

Expo automatically exposes `EXPO_PUBLIC_` variables to the app.

## Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Open Project Settings → API and copy:
   - Project URL → `EXPO_PUBLIC_SUPABASE_URL`
   - anon/public key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Apply schema:
   - In Supabase Dashboard → SQL Editor
   - Open `campulse/DATABASE_SCHEMA.md`
   - Run the SQL blocks in order:
     - profiles
     - categories
     - products
     - favorites
     - conversations
     - messages
     - reviews
     - notifications
     - transactions
     - functions & triggers
4. Storage buckets are provisioned in the schema (`avatars`, `product-images`) with RLS policies.

### Seed Categories (optional)

Run in SQL Editor:

```sql
insert into categories (name) values
('Textbooks'), ('Electronics'), ('Dorm & Home'), ('Fashion'), ('Other')
on conflict (name) do nothing;
```

## Supabase Client

- Config at `src/lib/supabase.ts`
- Uses `react-native-url-polyfill/auto` and `@react-native-async-storage/async-storage`
- Reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Database Schema (Overview)

- `profiles` (extends `auth.users`): email, full_name, avatar_url, bio, phone, location,
  matric_number, nin_document_url, verification_status ('none'|'pending'|'approved'|'rejected'),
  verified, rating, total_reviews, timestamps.
- `categories`: id, name
- `products`: seller_id → profiles, title, description, price, category_id → categories,
  condition ('new'|'like-new'|'good'|'fair'|'poor'), images[], timestamps.
- `favorites`: user_id → profiles, product_id → products
- `conversations`: participant1_id, participant2_id, product_id (nullable)
- `messages`: conversation_id, sender_id, content, read, created_at
- `reviews`: reviewer_id, reviewed_user_id, product_id (nullable), rating, comment
- `notifications`: user_id, type, title, body, data, read
- `transactions`: buyer_id, seller_id, product_id, amount, status, timestamps

RLS policies are defined for every table to ensure users can only access their own data where appropriate; products and categories are publicly readable.

## Current State

- Packages updated to Expo 54 compatibility.
- Supabase installed and configured (`@supabase/supabase-js`, `react-native-url-polyfill`).
- `.env` placeholders added.
- Schema defined in `DATABASE_SCHEMA.md` and TypeScript types in `src/types/database.ts` are in sync.
- App currently uses mock data and a mock auth context.
- Integration plan is to start with `AuthScreen` (auth first).

## Integration Plan (Page-by-Page)

### 1) AuthScreen (first)

- Replace mock `AuthContext` with Supabase Auth flows:
  - Email/password sign-up and sign-in
  - Password reset (optional)
  - Persist session via AsyncStorage (already configured in client)
  - On successful auth, fetch `profiles` row for the user (create if missing)
- Add a development path using `EXPO_PUBLIC_DEV_USER_ID` for bypass during local testing (optional).
- Route unauthenticated users to `AuthScreen`; authenticated users to main tabs.

Suggested services to add:
- `src/services/authService.ts`
  - `signIn(email: string, password: string)`
  - `signUp(email: string, password: string, profilePatch?: Partial<ProfilesRow>)`
  - `signOut()`
  - `getCurrentUser()` (wrapper for `supabase.auth.getUser()`)
- `src/services/profileService.ts`
  - `getProfileById(id: string)`
  - `upsertProfile(row: ProfilesInsert | ProfilesUpdate)`

Types: import from `src/types/database.ts` to strongly type rows and payloads.

### 2) ProfileScreen

- Replace mock profile with real Supabase fetch by `userId` (from auth session).
- Implement update flow for: `full_name`, `email`, `phone`, `location`, `bio`.
- Avatar upload to `avatars` bucket → store public URL in `profiles.avatar_url`.
- Verification UI:
  - `matric_number` (text input)
  - NIN image upload → store `nin_document_url`
  - Show `verification_status` badge; set to `pending` when user submits request.
- Replace Sales/Purchases tabs with data from `transactions`:
  - Sales: `seller_id = userId`
  - Purchases: `buyer_id = userId`

### 3) Listings (Home/Browse/ListingDetails/Sell)

- Replace mocks with queries to `products` + `categories` joins.
- Use storage `product-images` for uploads on Sell flow.
- For Browse, filter by `category_id`, price ranges, condition.

### 4) Messages & Conversations

- Create/lookup conversation by participants (+ optional product_id).
- Realtime messages with `supabase.channel` or start with polling, then upgrade.
- Mark messages `read` on view.

### 5) Favorites

- Toggle favorite by inserting/deleting from `favorites`.
- User-only visibility via RLS.

### 6) Reviews & Ratings

- Insert review after a completed transaction.
- Profile rating auto-updates via trigger provided in schema.

### 7) Notifications

- Insert rows on key events (new message, review, product sold, etc.).
- Show unread indicator; allow marking read.

## Commands & Scripts

- `npm run start` → Expo Dev Client
- `npm run android` / `npm run ios` → build & run native apps
- `npm run web` → run web target

## Code Conventions

- Use TypeScript strict typing with `src/types/database.ts` for Supabase rows.
- Keep services in `src/services/` as thin data-access layers.
- Avoid importing supabase directly in screens; go through services for testability.
- Keep environment access only in `supabase.ts`.

## Troubleshooting

- Missing Supabase keys → app logs: "Supabase URL or Anon Key is missing"
- RLS errors (permission denied) → verify policies in `DATABASE_SCHEMA.md`
- Expo cannot read .env → ensure variables are prefixed with `EXPO_PUBLIC_` and restart the dev server
- Image upload issues → confirm buckets exist (`avatars`, `product-images`) and policies applied

## Handoff Checklist

- [ ] Update `.env` with real Supabase URL and anon key
- [ ] Apply `DATABASE_SCHEMA.md` SQL to Supabase
- [ ] Seed baseline categories
- [ ] Implement `authService.ts` and wire `AuthScreen`
- [ ] Implement `profileService.ts` and wire `ProfileScreen`
- [ ] Implement `transactionsService.ts` and wire Sales/Purchases tabs
- [ ] Replace mocks in Home/Browse/ListingDetails with Supabase data
- [ ] Plan messaging realtime (optional: start with fetch + poll)

## Notes for the Next Engineer/Model

- Start with `AuthScreen.tsx` to replace the mock auth context with Supabase.
- Use `src/lib/supabase.ts` for the client; don’t re-initialize.
- Database schema and types are aligned; if you change SQL, also update `src/types/database.ts`.
- Keep small, incremental PRs per page (Auth → Profile → Listings → Messages → Favorites → Reviews → Notifications).

## Backlog

- Favorites
  - Add `favorites` table in Supabase with RLS (user-only read/write)
  - Implement service APIs: add/remove/check, list user favorites
  - Toggle heart on Listing Details and reflect count/state across Browse/Home
  - Optional: Favorites tab/section in Profile

- Avatar Upload Integration
  - Implement avatar change UI (tap-to-edit)
  - Upload to `avatars` bucket at `${userId}/avatar`
  - Persist `profiles.avatar_url` and read on profile load

- Verification Enhancements
  - Persist `matric_number`, `nin_document_url`, set `verification_status` to `pending`
  - Admin review flow (approve/reject) and badge propagation

- Messaging Realtime
  - Replace dummy chat with Supabase conversations/messages and channels
  - Read receipts and typing indicators

- Notifications Persistence
  - Insert notifications on events, unread counts, mark-as-read
