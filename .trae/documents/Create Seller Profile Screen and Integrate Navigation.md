## Goal
Create a dedicated Seller Profile page that displays a seller’s public information and active listings, fetched from the database, and integrate it into navigation so it opens from Listing Details.

## Scope & Features
- Screen: Seller Profile (`SellerProfileScreen.tsx`)
- Data: Fetch seller `profile` by `userId`, total `listings` count, and recent `active listings`
- Header: Profile photo, name, rating, reviews count, “Member since”, verified/unverified badge
- Stats: Number of listings (only)
- Listings: Grid/scroll of seller’s active listings (title, image, price); tap to open Listing Details
- Actions for buyer: Message Seller (navigate to `Chat`), View all listings
- States: Loading skeleton/spinner, error state, empty state for listings

## Navigation & Types
- Add route type: `SellerProfile: { userId: string }` in `RootStackParamList`
- Register stack route in `AppNavigator.tsx` and import the new screen
- Update Listing Details to navigate to `SellerProfile` using `currentProduct.seller_id`

## Data Integration
- Use existing services:
  - `getProfileById(userId)` for seller info
  - `countProductsBySeller(userId)` for listings count
  - `getProductsBySeller(userId, limit)` for active listings
- Display fields: `avatar_url`, `name`, `rating`, `total_reviews`, `created_at`, `verified`/`verification_status`

## Implementation Steps
1. Update types in `src/types/navigation.ts` to add `SellerProfile`
2. Add `SellerProfile` stack in `src/navigation/AppNavigator.tsx`
3. Create `src/screens/SellerProfileScreen.tsx` using structure and styles similar to `ProfileScreen.tsx`, but driven by route `userId`
4. Fetch data in `useEffect` hooks; populate UI with loading/error/empty states
5. Replace Listing Details “View Profile” navigation to use `SellerProfile` with `seller_id`
6. Run TypeScript checks and fix issues if any

## Verification
- Navigate from a listing to the seller profile and confirm:
  - Correct seller info renders
  - Listings count and items appear
  - Message Seller button navigates to Chat with seller
  - Edge cases: missing profile, zero listings, unverified sellers

## Notes
- Reuse color palette and components for consistent UI
- Avoid exposing sensitive data; only public profile fields
- Keep logs minimal or gated during production