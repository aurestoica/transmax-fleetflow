
-- Add edit/delete tracking columns to messages
ALTER TABLE public.messages 
  ADD COLUMN edited_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN edit_history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN deleted_content text DEFAULT NULL;

-- Allow users to update their own messages (for editing)
CREATE POLICY "Users can update own messages"
  ON public.messages
  FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);
