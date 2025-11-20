## Summary of Current Integration

* Auth flows use Supabase and React Context; session bootstraps and onAuthStateChange handled (`src/context/AuthContext.tsx`:45–81, 83–111, 113–173, 175–186).

* Profile pulls, edits, and aggregates live data via services:

  * Profile load and upsert (`src/screens/ProfileScreen.tsx`:86–116, 260–318).

  * Stats and lists from products/transactions (`src/screens/ProfileScreen.tsx`:136–178, 191–236).

* Sell screen creates/edits/deletes products and uploads images to Supabase Storage:

  * Create with `ensureRemoteImageUrls` and insert (`src/screens/SellScreen.tsx`:154–169, 170–189).

  * Update/delete flows (`src/screens/SellScreen.tsx`:203–266, 268–299).

  * Storage upload/getPublicUrl (`src/services/storageService.ts`:4–31).

* Service layer wraps all Supabase access (auth/profile/product/transactions) with typed responses.

## Gaps and Cleanups

* Home/Browse/ListingDetails still use mock data (`src/constants/products.ts`, `src/screens/BrowseScreen.tsx`, `src/screens/HomeScreen.tsx`, `src/screens/ListingDetailsScreen.tsx`).

* ListingDetails contains JSX comment syntax issues (`src/screens/ListingDetailsScreen.tsx`:286–295) and should use `{/* ... */}`.

* AuthScreen uses `window.alert` (web-only) instead of cross-platform `Alert.alert` (`src/screens/AuthScreen.tsx`:37, 48–56, 60–61, 66–72, 80–85, 89–90).

* Icon names in categories may not exist in Ionicons set (e.g., `laptop`) (`src/constants/categories.ts`:9–18).

* Empty `src/types/supabase.ts` suggests missing generated types; consider generating from Supabase.

* Dev logs in navigation/contexts should be gated behind a debug flag (`src/navigation/AppNavigator.tsx`:92–121).

## Proposed Plan

### Phase 1: Replace Mocks with Supabase Data

1. Home/Browse: query `products` with category/condition filters; paginate; remove MOCK\_PRODUCTS.
2. ListingDetails: fetch by product id; derive related items via category.
3. Normalize category source (string vs categories table) to match DB schema.

### Phase 2: Profile Enhancements

1. Verification flow UI wiring: persist `matric_number`, `nin_document_url`, `verification_status`.
2. Avatar/NIN uploads to storage buckets; update profile fields.

### Phase 3: Favorites

1. Implement toggle and list endpoints; surface favorites in UI.

### Phase 4: Messaging

1. Replace dummy chat service with Supabase conversations/messages tables.
2. Introduce realtime channels; mark-read mechanics.

### Phase 5: Notifications

1. Persist notifications in DB; implement unread counts and mark-as-read.

### Phase 6: UX & Reliability

1. Switch `window.alert` to `Alert.alert` in `AuthScreen`.
2. Fix JSX comments and minor UI polish; validate icon names.
3. Add error states and loading spinners consistently across screens.

### Phase 7: Types & Tooling

1. Generate Supabase types into `src/types/supabase.ts` and use across services.
2. Add unit/integration tests for services; minimal e2e flows.

### Rollout

* Implement incrementally per phase; keep screens testable via services.

* No execution until approved; once confirmed, proceed with Phase 1 and verify on native/web.

