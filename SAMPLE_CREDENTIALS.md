# Sample Login Credentials for Testing

## Test Student Account
**Email:** student@vvce.edu  
**Password:** Test123!  
**Role:** Student  
**Purpose:** Test the complete student flow (create ideas, find mentors, request mentorship)

---

## Test Mentor Account (Alumni)
**Email:** mentor@vvce.edu  
**Password:** Test123!  
**Role:** Alumni  
**Purpose:** Test the mentor flow (view requests, accept/reject mentorship)

---

## Test Faculty Account
**Email:** faculty@vvce.edu  
**Password:** Test123!  
**Role:** Faculty  
**Purpose:** Test faculty mentor flow and proof verification

---

## Admin Account (for verification)
**Email:** admin@vvce.edu  
**Password:** Admin123!  
**Role:** Admin  
**Purpose:** Verify mentor proofs and approve mentors

---

## Complete Test Flow

### Step 1: Student Creates Idea
1. Login as `student@vvce.edu`
2. Go to Launchpad
3. Create a new startup idea with:
   - **Title:** AI-Powered AgriTech Platform
   - **Problem:** Farmers lack real-time crop disease detection
   - **Solution:** ML-based mobile app for instant disease diagnosis
   - **Target User:** Small-scale farmers
   - **Tags:** AI, ML, Agriculture, IoT
   - **Tech Stack:** Python, TensorFlow, React Native, IoT
   - **Stage:** Idea

### Step 2: AI Validates Idea
- System automatically validates and gives feasibility score
- Provides recommendations

### Step 3: Student Finds Mentors
1. Go to **Placement** page
2. Click **Find Mentors** for your idea
3. System matches you with relevant mentors
4. See mentor cards with match scores
5. Click **Request Mentorship** on a mentor
6. Write a personal message
7. Submit request

### Step 4: Mentor Reviews Request
1. Logout from student account
2. Login as `mentor@vvce.edu`
3. Complete mentor profile setup (if first time):
   - **Startup Name:** AgroSense AI
   - **Domain:** AgriTech
   - **Tech Stack:** ML, IoT, Python
   - **Help Areas:** Technical Architecture, MVP Development
   - **Preferred Stages:** Idea, POC
   - **Availability:** Yes
4. Go to **Requests** page in bottom nav
5. See incoming mentorship request with:
   - Student details
   - Idea description
   - Match scores
   - Why you're matched
6. Add optional feedback
7. Click **Accept** or **Decline**

### Step 5: Collaboration Begins
1. Once accepted, both student and mentor can:
   - Use Kanban board for task management
   - View and update roadmap
   - Share progress updates
   - Communicate via comments

---

## Mentor Matching Algorithm

The system uses a hybrid approach:

1. **Pre-filtering (Interest-based):**
   ```
   Match if:
   - Mentor domain preferences overlap with idea tags
   - Mentor tech expertise overlaps with idea tech stack
   - Mentor has mentorship_availability = true
   ```

2. **AI Scoring (Gemini 2.5 Flash):**
   ```
   Scores:
   - Domain Match (0-100)
   - Tech Match (0-100)
   - Stage Match (0-100)
   - Overall Score (weighted average)
   ```

3. **Filtering & Ranking:**
   ```
   - Only matches with overall_score > 40
   - Top 5 mentors by overall score
   ```

4. **Match Reason:**
   - AI generates 2-3 sentence explanation
   - Explains why this is a good/bad match

---

## Database Tables Overview

### `profiles`
Stores user profile data including mentor details:
- `user_id` (FK to auth.users)
- `full_name`, `email`, `avatar_url`
- `startup_name`, `startup_domain`, `tech_stack`
- `domain_preferences[]`, `expertise[]`, `help_areas[]`
- `preferred_idea_stages[]`
- `mentorship_availability` (boolean)

### `startup_ideas`
Student's startup ideas:
- `user_id` (FK to auth.users)
- `title`, `problem`, `solution`, `target_user`
- `tags[]`, `tech_stack[]`
- `stage` (idea/poc/mvp)

### `mentor_matches`
AI-generated mentor-student matches:
- `student_id`, `mentor_id`, `idea_id`
- `domain_match_score`, `tech_match_score`, `stage_match_score`
- `overall_score`, `match_reason`

### `mentor_requests`
Student's mentorship requests:
- `student_id`, `mentor_id`, `idea_id`, `match_id`
- `message` (student's personal note)
- `status` (pending/accepted/rejected)
- `mentor_feedback` (mentor's response)

### `kanban_tasks`
Task management for ideas:
- `idea_id`, `created_by`, `assigned_to`
- `title`, `description`, `status`
- `priority`, `comments[]`

### `progress_updates`
Weekly student progress:
- `idea_id`, `student_id`, `week_number`
- `update_text`, `risks_identified[]`
- `mentor_feedback`, `ai_summary`

---

## Features Implemented

✅ **Role-based Authentication** (student/faculty/alumni)  
✅ **Mentor Profile Setup** (startup details, expertise, availability)  
✅ **AI Idea Validation** (feasibility scoring)  
✅ **Interest-based Pre-filtering** (domain & tech matching)  
✅ **AI Mentor Matching** (Gemini 2.5 Flash scoring)  
✅ **Match Explanation** (AI-generated reasons)  
✅ **Mentorship Requests** (with personal messages)  
✅ **Accept/Reject Flow** (with optional feedback)  
✅ **Task Management** (Kanban board)  
✅ **Roadmap Generation** (AI-powered)  
✅ **Progress Tracking** (weekly updates)  
✅ **Pitch Deck Generation** (AI-powered)

---

## API Endpoints (Edge Functions)

### `/match-mentors`
- **Method:** POST
- **Body:** `{ ideaId: string }`
- **Returns:** Array of matched mentors with scores
- **Process:**
  1. Fetch idea details
  2. Pre-filter mentors by interests
  3. AI scores each mentor
  4. Return top 5 matches

### `/validate-idea`
- **Method:** POST
- **Body:** `{ ideaId: string }`
- **Returns:** Validation scores and recommendations

### `/generate-roadmap`
- **Method:** POST
- **Body:** `{ ideaId: string }`
- **Returns:** 6-week execution roadmap

### `/generate-pitch-deck`
- **Method:** POST
- **Body:** `{ ideaId: string }`
- **Returns:** Pitch deck content (JSON)

---

## Notes

- All AI features use **Lovable AI** (no API keys required)
- Uses **Gemini 2.5 Flash** by default (fast, cost-effective)
- RLS policies ensure data security
- Real-time updates via Supabase subscriptions
- Auto-confirm email enabled for easy testing
