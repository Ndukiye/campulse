## Objectives
- Replace mock conversations with Supabase-backed data and realtime updates.
- Implement image/document attachments: upload, persist, display.
- Bind Chat header to the other user’s profile (name, avatar, verified) and show live status.

## Data & Schema Alignment
- Conversations:
  - Use `participant_1`, `participant_2`, and optional `product_id` when chat originates from a listing.
  - Add helper queries: list conversations for `auth.uid()`; compute last message, unread count.
- Messages:
  - Persist `message_type` (`text|image|document`) and `attachment_url` when sending attachments.
  - Continue realtime subscribe on `messages` by `conversation_id`.
- Profiles:
  - Read `name`, `avatar_url`, `verified` for header; no schema change needed.
- Storage:
  - Create `chat-attachments` bucket (recommended) with RLS similar to `product-images` (public read; authenticated insert/update/delete with first path segment = `auth.uid()`).
  - If bucket creation is deferred, temporarily restrict attachments to images uploaded to `product-images/${userId}/...` and mark `message_type=image` (not ideal; prefer dedicated bucket).

## Services to Add/Update
- `chatService`:
  - `listConversations(userId)`: select conversations where `participant_1=userId OR participant_2=userId`; join last message and other participant profile; return `{ id, otherUser: { id,name,avatar_url,verified }, lastMessage: { text|type, created_at, unreadCount }, product?: { id,title,image } }`.
  - `sendMessage(conversationId, senderId, text, attachment?)`:
    - If `attachment` present: upload to storage; set `message_type` and `attachment_url`.
  - `subscribeToConversations(userId, onUpdate)`: optional; use `postgres_changes` on `messages` to recompute last-message/unread counts.
- `storageService`:
  - `uploadChatAttachment(uri, userId)`: choose bucket (`chat-attachments`), use `arrayBuffer()`, infer MIME, upload to `${userId}/timestamp_random.ext`, return public URL.

## UI Integration
- MessagesScreen:
  - Replace `MOCK_CONVERSATIONS` with `listConversations(user.id)`.
  - Show avatar/name from `otherUser`; product preview if present.
  - Unread indicator based on unread count.
  - Tap opens `Chat` with `otherUser.id`.
  - Optional: realtime refresh via `subscribeToConversations`.
- ChatScreen:
  - Header: fetch other user profile for name, avatar, verified badge.
  - Sending:
    - When attachment selected, upload via `uploadChatAttachment` and send message with `message_type` and `attachment_url`.
  - Rendering:
    - If `message_type==='image'`, show image via `attachment_url`.
    - If `document'`, show icon + name, size.
  - Keep typing indicator and read receipts.
- ListingDetails:
  - If navigating from listing, pass `product_id` for conversation ensure (threading messages to a specific product).

## RLS & Permissions (if bucket introduced)
- Storage `chat-attachments` policies:
  - Select: `bucket_id='chat-attachments'` public.
  - Insert/Update/Delete: `bucket_id='chat-attachments' AND (auth.uid())::text = (storage.foldername(name))[1]`.
- No DB policy changes needed beyond existing conversations/messages policies.

## Validation
- Seed one conversation and send messages with and without attachments.
- Verify:
  - `conversations` row created with `participant_1/2` (and `product_id` when applicable).
  - `messages` include `message_type`, `attachment_url` for attachments.
  - Storage object uploaded to correct bucket/path; public URL accessible.
  - Messages list shows correct last message, unread counts; opens Chat correctly.
  - Header shows correct name/avatar/verified state.

## Deliverables
- Updated services (`chatService`, `storageService`) and screens (`MessagesScreen`, `ChatScreen`) wired to Supabase.
- Comprehensive test run results and a short report of any schema/policy changes applied.
- Clear fallback strategy if `chat-attachments` bucket isn’t available (temporary use of `product-images`).

Once approved, I will implement these changes, run live validation, and provide the verification report.