# Step-by-Step Mentor Matching Demo

## Prerequisites
✅ Mock mentor accounts created (see MENTOR_TEST_ACCOUNTS.md)
✅ Code updated with proper database joins

## Step 1: Setup Mentor Accounts (5 minutes)

### Create Accounts
1. **Sign up as mentor #1**
   - Go to Auth page
   - Click "Sign Up"
   - Email: `sarah.chen@ionconnect.com`
   - Password: `Mentor@123`
   - Select Role: **Faculty**

2. **Complete Mentor Profile**
   - After signup, fill out mentor profile form:
     - **Startup Name**: TechVision AI
     - **Domain**: Select "AI/ML"
     - **Tech Stack**: Python, TensorFlow, PyTorch
     - **Expertise**: Machine Learning, Computer Vision
     - **Help Areas**: Technical Architecture, AI Strategy
     - **Mentorship Availability**: ✅ Enable
   - Click "Complete Setup"

3. **Repeat for mentor #2** (Optional but recommended)
   - Email: `raj.patel@ionconnect.com`
   - Password: `Mentor@123`
   - Role: **Alumni**
   - Domain: **HealthTech**
   - Expertise: Healthcare, Product Strategy

## Step 2: Create Student Account & Idea (3 minutes)

1. **Sign up as student**
   - Sign out from mentor account
   - Create new account with any email (e.g., `student1@test.com`)
   - Password: your choice
   - Select Role: **Student**

2. **Go to Launchpad**
   - Click "Launchpad" in bottom navigation
   - Click "Create New Idea" button

3. **Fill out idea form**
   - **Title**: "AI Health Diagnosis App"
   - **Problem**: "People struggle to get quick medical advice"
   - **Solution**: "AI-powered symptom checker with doctor consultation"
   - **Target Users**: "Healthcare patients seeking quick diagnosis"
   - **Domain/Tags**: Select **"AI/ML"** and **"HealthTech"**
   - **Tech Stack**: Python, React, TensorFlow
   - **Stage**: Idea
   - Click "Submit"

## Step 3: Find Mentors (2 minutes)

1. **Navigate to Placement page**
   - Click "Placement" in bottom navigation
   - You should see your idea card

2. **Click "Find Mentors" button**
   - System will call AI matching function
   - Wait 5-10 seconds for processing
   - You should see toast: "Found X potential mentors"

3. **View matched mentors**
   - Mentor cards will appear below your idea
   - Each card shows:
     - ✅ Mentor name (Dr. Sarah Chen, etc.)
     - ✅ Startup name (TechVision AI, etc.)
     - ✅ Match score (e.g., "85% Match")
     - ✅ Domain & expertise
     - ✅ Match reason explanation

## Step 4: Filter by Domain (1 minute)

1. **Use domain filters at top**
   - Click "AI/ML" badge → Shows only AI/ML mentors
   - Click "HealthTech" badge → Shows only HealthTech mentors
   - Click both → Shows mentors in either domain
   - Click again to deselect

## Step 5: Request Mentorship (1 minute)

1. **Send mentor request**
   - Click "Request Mentor" button on any mentor card
   - Button should show "Request Sent" after success
   - Toast notification appears

2. **Verify request sent**
   - Button is now disabled and shows "Request Sent"

## Step 6: Mentor Accepts Request (2 minutes)

1. **Log in as mentor**
   - Sign out from student account
   - Sign in with mentor credentials used earlier

2. **Check requests** (Implementation needed)
   - Go to mentor dashboard/requests page
   - Accept the student's request
   - This creates a Lounge channel for communication

## Troubleshooting

### Issue: "5 mentors found" but NO CARDS appear 🚨

**ROOT CAUSE:** Mentor accounts exist in auth but profiles aren't in database.

**THE FIX - CRITICAL:**
1. For EACH mentor account, you MUST:
   - Sign up with the account
   - Complete the full onboarding flow
   - Fill in ALL mentor profile fields:
     - ✅ Startup Name
     - ✅ Startup Domain (AI/ML, HealthTech, etc.)
     - ✅ Tech Stack
     - ✅ Expertise (at least 2-3 items)
     - ✅ Team Size & Traction
     - ✅ Help Areas
     - ✅ **Enable "Available for Mentorship"** - CRITICAL!
   - Save the profile

2. **Verify profiles created:**
   - Log in as each mentor
   - Go to Profile page
   - All information should be visible
   - "Available for Mentorship" should be enabled

3. **If still not showing:**
   - Check browser console (F12) for errors
   - Verify student's idea tags overlap with mentor's domain/expertise
   - Try creating a new match (click "Find Mentors" again)

### "0 mentors found"
✅ **FIXED** - Updated database join query
- Check that mentor accounts have:
  - ✅ mentorship_availability = true
  - ✅ startup_domain filled in
  - ✅ expertise array populated
- The AI matching looks for domain/expertise overlap

### No matches appear after "Find Mentors"
- Open browser console (F12) → Check for errors
- Verify edge function deployed successfully
- Check that idea has tags/tech_stack filled in

### Mentor cards show "undefined"
✅ **FIXED** - Changed `match.profiles` to `match.mentor`
- This was a join alias issue, now resolved

### Error: "Could not load mentor matches"
- Check database foreign keys are set up
- Verify RLS policies allow student to view matches
- Check edge function logs for errors

## Expected Results

After following these steps, you should see:
1. ✅ Student can create ideas with tags
2. ✅ "Find Mentors" button triggers AI matching
3. ✅ Matched mentors appear with scores (40-100%)
4. ✅ Domain filtering works correctly
5. ✅ Request button sends mentorship requests
6. ✅ Mentor names, domains, expertise visible
7. ✅ Match reasons explain why they're good fits

## Database Verification

To verify matches in database:
```sql
-- Check mentor matches
SELECT 
  m.*,
  p.full_name as mentor_name,
  p.startup_domain
FROM mentor_matches m
JOIN profiles p ON m.mentor_id = p.user_id
ORDER BY m.created_at DESC
LIMIT 10;
```
