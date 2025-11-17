## Scope
- Extend the create/edit listing flow to accept, upload, store, and retrieve multiple images per product.
- Keep existing UI/validation patterns; update only the image section and payload logic.

## Approach
- Storage: Upload local URIs to Supabase Storage (`product-images`) and store public URLs; keep existing remote URLs.
- UI: Replace single image picker with multi-select and a thumbnail gallery with remove per image.
- Data: Use `images: string[]` consistently, mapping to public URLs during create/update.

## Implementation Details
- Storage helpers:
  - Add `ensureRemoteImageUrls(uris: string[], sellerId: string)` that uploads non-remote URIs and returns all remote URLs.
- SellScreen:
  - State: replace `image: string | null` with `images: string[]`.
  - Picker: `launchImageLibraryAsync({ allowsMultipleSelection: true, ... })` and append selected URIs to `images`.
  - Prefill on edit: `setImages(item.images ?? [])` and keep description prefill.
  - Submit (create/update): call `ensureRemoteImageUrls(images, user.id)`; use returned URLs in `payload.images`.
  - Gallery UI: render thumbnails (first image remains used in grid); allow remove per image.

## UX/Validation
- Button: "Add Images" supports multiple additions.
- No hard limit enforced; optionally cap to e.g., 10 in code if needed later.
- Validation remains identical; images optional.

## Files Impacted
- `src/services/storageService.ts`: add `ensureRemoteImageUrls`.
- `src/screens/SellScreen.tsx`: refactor image state/handlers, prefill, submit logic, and gallery UI.

## Testing Plan
- Create listing with multiple images (local URIs) → verify upload and persistence; card shows first image.
- Edit listing: add/remove images → save → confirm list updates and images load after refresh.
- Test on web/native; confirm no `file:///` URLs and no `ERR_FILE_NOT_FOUND`.

Confirm to proceed and I will implement and verify end-to-end.