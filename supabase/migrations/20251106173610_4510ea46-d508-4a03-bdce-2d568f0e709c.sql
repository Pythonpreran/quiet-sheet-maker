-- Add unique constraint to pitch_decks.idea_id
-- This ensures one pitch deck per idea and allows upsert operations

ALTER TABLE public.pitch_decks 
ADD CONSTRAINT pitch_decks_idea_id_key UNIQUE (idea_id);