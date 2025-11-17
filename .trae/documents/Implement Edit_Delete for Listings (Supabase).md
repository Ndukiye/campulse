## Scope
- Enable editing existing listings in `SellScreen` by reusing the create form modal with prefilled values, persisting updates to Supabase.
- Keep the delete flow but add explicit confirmation and optimistic UI removal (already present), ensuring DB delete via Supabase.

## Current State
- Create listing implemented and saved to Supabase: `src/services/productService.ts:51-72`, used in `src/screens/SellScreen.tsx:123-177`.
- Delete listing with confirmation implemented: `src/screens/SellScreen.tsx:179-210` calls `deleteProduct` (`src/services/productService.ts:74-84`).
- Edit button is placeholder: `src/screens/SellScreen.tsx:238-246`.

## Data Model
- Products schema: `src/types/database.ts:30-44` with `title`, `description`, `price`, `category`, `condition`, `images`, `seller_id`.
- We will update rows via Supabase with RLS guard on `seller_id`.

## API Additions (Supabase)
- Add `updateProduct(payload: ProductsUpdate, sellerId: string)`:
  - `supabase.from('products').update(payload).eq('id', payload.id).eq('seller_id', sellerId).select('id,title,price,images,created_at,condition,category').single()`.
  - Return mapped `ProductSummary` shape like `createProduct`.
- Optional: `getProductById(id: string)` returning the same selected fields; used if we want freshest data before editing.

## UI/Logic Changes (SellScreen)
- State:
  - Add `editingItem: ProductSummary | null` and derive `isEditing = !!editingItem`.
  - Prefill form fields (`title`, `description`, `price`, `selectedCategory`, `condition`, `image`) when opening edit.
- Edit action:
  - Replace placeholder in `renderListingItem` edit button with a handler `openEdit(item)` that sets `editingItem` and `showCreateForm`.
- Modal behaviors:
  - Title: show `Edit Listing` when `isEditing`, else `Create New Listing`.
  - Submit button text: `Save Changes` when editing.
- Submit handler:
  - If `isEditing`:
    - Build `ProductsUpdate` with `id` and changed fields.
    - Call `updateProduct(updatePayload, user.id)`.
    - On success: update `listings` via map replacement with returned row; close modal; clear `editingItem` and `isSubmitting`.
    - On error: show `Alert` and keep modal open.
  - Else: use existing `handleCreateListing` path.
- Image handling:
  - If `editingItem.images?.[0]` exists, prefill `image`/preview; allow change/remove.
  - Persist `images` accordingly (`[]` if removed).
- Refresh:
  - Optionally call `loadListings(false)` after update/delete to re-sync with server.

## Validation & UX
- Reuse current validation for required fields and price parsing.
- Maintain disabled state with `isSubmitting` during API calls.
- Keep delete confirmation as implemented; ensures DB delete then removes from UI.

## RLS & Safety
- Update and delete both constrain by `seller_id` to prevent editing other users’ rows.
- Errors surfaced via `Alert`.

## Testing Plan
- Manual flows: create → edit (change title/price/category/condition/image) → verify persistence and UI update; delete → confirm removal and no errors; pull-to-refresh to confirm.
- Web/native parity: use existing Alert/Modal; image picker behavior guards already in place.

## Files Impacted
- `src/services/productService.ts`: add `updateProduct` (and optional `getProductById`).
- `src/screens/SellScreen.tsx`: add edit state/handlers, prefill logic, update submit behavior and modal titles.

Confirm to proceed with these changes and I will implement and verify end-to-end.