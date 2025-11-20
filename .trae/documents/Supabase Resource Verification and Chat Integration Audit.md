## What I Will Verify
- **Storage buckets**: `avatars`, `product-images` availability and basic access (list/read/upload where allowed).
- **Tables and fields in use**: `profiles`, `products`, `messages`, `conversations`, `favorites`, `transactions`.
- **RLS/permissions**: Policies for relevant tables and storage buckets align with app operations.

## Cross-Reference Findings (from code and migrations)
- **Buckets referenced in app**
  - `avatars` ✓ policies exist for select/insert/update/delete on storage objects
  - `product-images` ✓ policies exist for select and authenticated insert/update/delete
- **Tables/fields used by app**
  - `profiles` (app uses: id, email, name, avatar_url, phone, location, bio, verified, created_at; sometimes: verification_status, rating, total_reviews, matric_number, nin_document_url)
    - Migration has: id, email, name, avatar_url, phone, location, bio, verified, created_at, updated_at
    - Discrepancy: missing `verification_status`, `rating`, `total_reviews`, `matric_number`, `nin_document_url`
    - Trigger mismatch: `handle_new_user` inserts `full_name`; table column is `name`
  - `products` (app uses: id, title, description, price, category, condition, seller_id, images[], created_at)
    - Migration matches and includes `location`, `status`
  - `messages` (app uses: id, conversation_id, sender_id, content, read, created_at)
    - Migration matches; also has `message_type`, `attachment_url`
  - `conversations` (app expects participants; ensureConversation used `participant_a`/`participant_b`)
    - Migration has `participant_1` and `participant_2` + `product_id`
    - Discrepancy: column names differ
  - `favorites` (app uses favorites table)
    - Not present in migration
  - `transactions` (app uses transactions table)
    - Not present in migration

## Plan to Validate via Supabase API
1. **Storage validation**
   - List avatars: `await supabase.storage.from('avatars').list(user.id)` checks readable.
   - List product-images: `await supabase.storage.from('product-images').list(user.id)`.
   - Upload tests (authenticated):
     - Avatars: upload `ArrayBuffer` to `avatars/${user.id}/test.jpg`.
     - Product images: upload to `product-images/${user.id}/test.jpg`.
   - Get public URLs and verify fetch returns 200.
2. **Schema validation**
   - Profiles: `select('id,email,name,avatar_url,phone,location,bio,verified,created_at')` and attempt to select missing fields to confirm absence.
   - Products: `select('id,title,description,price,category,condition,seller_id,images,created_at')` sample row.
   - Messages: `select('id,conversation_id,sender_id,content,read,created_at')`.
   - Conversations: `select('id,participant_1,participant_2,product_id,created_at')`.
   - Favorites: attempt `select('*')` from `favorites` to confirm non-existence.
   - Transactions: attempt `select('*')` from `transactions` to confirm non-existence.
3. **Permissions validation**
   - Attempt read/write operations from an authenticated session to ensure policies permit expected actions.
   - For storage, verify that folder prefix equals `auth.uid()` according to policies when writing/deleting.

## Deliverables
- **Report** listing:
  - Verified resources (buckets/tables/columns)
  - Missing/misconfigured items
  - Recommended corrective actions

## Recommended Corrections (based on current audit)
- **Conversations**: Update app code to use `participant_1`/`participant_2` columns (and optionally `product_id` when chat is tied to a listing).
- **Profiles trigger**: Align trigger to write `name` instead of `full_name`, or add `full_name` column and update app to use it consistently.
- **Profiles extra fields**: Either add `verification_status`, `rating`, `total_reviews`, `matric_number`, `nin_document_url` to schema, or adjust app to remove/derive those fields.
- **Favorites/Transactions**: Create these tables (with necessary FKs and RLS), or remove features depending on them until schema is updated.

## Implementation Steps After Approval
1. Run a local validation script using the existing Supabase client to perform the API checks above and capture results.
2. Update chat service `ensureConversation` and queries to use `participant_1`/`participant_2`.
3. Fix the `handle_new_user` trigger or add `full_name` column and map to app.
4. Create `favorites` and `transactions` tables and minimal RLS policies consistent with current service usage; or temporarily gate features.
5. Re-run validation and provide the comprehensive report with actual results.

I will proceed to run the validations and apply the schema/code fixes once you approve this plan.