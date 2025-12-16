-- Add expo_push_token column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Create an index for faster lookups (optional but good for frequent updates)
CREATE INDEX IF NOT EXISTS idx_profiles_expo_push_token ON profiles(expo_push_token);

-- Update RLS policies to allow users to update their own push token
-- (Assuming existing update policy covers this, but being explicit is safe)
-- If you have a specific policy for updating specific columns, you might need to adjust it.
-- Generally, the 'Users can update their own profile' policy is sufficient:
-- CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
