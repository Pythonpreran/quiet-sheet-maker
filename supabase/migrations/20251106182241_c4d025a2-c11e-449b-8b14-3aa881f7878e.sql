-- Add foreign keys from mentor_requests to profiles table
-- First, ensure mentor_requests.student_id and mentor_id reference profiles.user_id

-- Drop existing foreign keys if they exist (they might reference auth.users)
ALTER TABLE mentor_requests DROP CONSTRAINT IF EXISTS mentor_requests_student_id_fkey;
ALTER TABLE mentor_requests DROP CONSTRAINT IF EXISTS mentor_requests_mentor_id_fkey;

-- Add new foreign keys to profiles table
ALTER TABLE mentor_requests 
ADD CONSTRAINT mentor_requests_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE mentor_requests 
ADD CONSTRAINT mentor_requests_mentor_id_fkey 
FOREIGN KEY (mentor_id) REFERENCES profiles(user_id) ON DELETE CASCADE;