# How to Set Up Test Accounts

## Quick Start Guide

Follow these steps to create test accounts and test the complete mentor matching flow:

---

## Step 1: Create Test Users in Auth

You need to create 3 test users manually:

### Option A: Using Lovable Cloud UI
1. Click **"View Backend"** button in chat (or go to Cloud tab)
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"**
4. Create the following users:

#### User 1: Student
- **Email:** student@vvce.edu
- **Password:** Test123!
- ✅ **Auto-confirm:** Yes

#### User 2: Alumni Mentor
- **Email:** mentor@vvce.edu
- **Password:** Test123!
- ✅ **Auto-confirm:** Yes

#### User 3: Faculty Mentor
- **Email:** faculty@vvce.edu
- **Password:** Test123!
- ✅ **Auto-confirm:** Yes

---

## Step 2: Test the Complete Flow

### 🎓 **Test as Student**

1. **Login as Student**
   - Go to your app
   - Click **Sign In**
   - Email: `student@vvce.edu`
   - Password: `Test123!`

2. **Complete Onboarding**
   - Select role: **Student**
   - Fill in your details
   - System will redirect you to home page

3. **Create a Startup Idea**
   - Click **Launchpad** in bottom nav
   - Click **"Create New Idea"**
   - Fill in the form:
     ```
     Title: AI-Powered AgriTech Platform
     Problem: Small-scale farmers lack access to real-time crop disease detection
     Solution: ML-based mobile app for instant disease diagnosis from crop photos
     Target User: Small and medium-scale farmers
     Tags: AI, ML, Agriculture, IoT
     Tech Stack: Python, TensorFlow, React Native, IoT
     Stage: Idea
     ```
   - Click **Submit**

4. **AI Validates Your Idea**
   - System automatically validates
   - Shows feasibility score
   - Provides recommendations
   - Click **"Generate Roadmap"** to get 6-week plan

5. **Find Mentors**
   - Go to **Placement** page (bottom nav)
   - You'll see your ideas listed
   - Click **"Find Mentors"** for your idea
   - System will show matched mentors with:
     - Match percentage
     - Domain alignment
     - Tech stack overlap
     - Why they're a good match

6. **Request Mentorship**
   - Click **"Request Mentorship"** on a mentor card
   - Write a personal message explaining why you want their guidance
   - Click **Send Request**
   - Status changes to "Pending"

---

### 👨‍💼 **Test as Mentor (Alumni)**

1. **Logout from Student Account**
   - Click profile icon
   - Click **Logout**

2. **Login as Mentor**
   - Email: `mentor@vvce.edu`
   - Password: `Test123!`

3. **Complete Mentor Profile Setup** (First time only)
   - Select role: **Alumni** or **Faculty**
   - Fill in your startup information:
     ```
     Startup Name: AgroSense AI
     Domain: AgriTech
     Tech Stack: Python, TensorFlow, IoT, React Native
     Traction: Launched MVP, 500+ farmer users
     Team Size: 4
     ```
   - Select your expertise areas:
     - ✅ Machine Learning
     - ✅ IoT Systems
     - ✅ MVP Development
   
   - Select help areas you can offer:
     - ✅ Technical Architecture
     - ✅ Product Development
     - ✅ Go-to-Market Strategy
   
   - Select preferred idea stages:
     - ✅ Idea
     - ✅ POC
     - ✅ MVP
   
   - Toggle **"Available for Mentorship"** to ON
   - Click **Complete Setup**

4. **View Mentorship Requests**
   - Go to **Requests** page (bottom nav)
   - You'll see incoming requests with:
     - Student name and details
     - Startup idea description
     - Match scores (Domain, Tech, Overall)
     - "Why You're Matched" explanation
     - Student's personal message

5. **Accept or Decline Request**
   - Read the request carefully
   - (Optional) Add feedback in the text box
   - Click **Accept** to start mentoring
   - Or click **Decline** if not a good fit

---

### 👨‍🏫 **Test as Faculty**

Same as Alumni mentor flow, but:
- Login with `faculty@vvce.edu`
- Select role: **Faculty**
- Fill academic expertise instead of startup info

---

## Step 3: Verify the Matching Algorithm

### How It Works:

```
┌─────────────────────────────────────────────────┐
│ 1. Student Creates Idea                         │
│    Tags: [AI, ML, Agriculture, IoT]             │
│    Tech: [Python, TensorFlow, React Native]     │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 2. Pre-Filter Mentors (Interest-Based)          │
│    ✅ mentorship_availability = true            │
│    ✅ has filled startup profile                │
│    ✅ domain_preferences overlap with idea tags │
│    ✅ expertise overlap with tech_stack         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 3. AI Scoring (Gemini 2.5 Flash)                │
│    - Domain Match Score (0-100)                 │
│    - Tech Match Score (0-100)                   │
│    - Stage Match Score (0-100)                  │
│    - Overall Score (weighted)                   │
│    - Match Reason (AI explanation)              │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 4. Filter & Rank                                │
│    ✅ Overall score > 40                        │
│    ✅ Sort by overall score                     │
│    ✅ Return top 5 matches                      │
└─────────────────────────────────────────────────┘
```

### Expected Match:
If student creates an **AgriTech + AI/ML** idea:
- **Mentor "Kiran Sharma"** (AgroSense AI) should appear
- **Match score:** 85-95%
- **Reason:** "Strong domain alignment in AgriTech and overlapping tech stack (Python, TensorFlow, IoT)"

---

## Step 4: Test Collaboration Features

Once a mentor accepts the request:

### For Students:
1. Go to **Launchpad**
2. Click on your idea
3. View **Tasks** (Kanban board)
4. View **Roadmap** (AI-generated plan)
5. Click **"Generate Pitch Deck"**

### For Mentors:
1. View student's idea details
2. Add tasks to Kanban board
3. Leave comments on tasks
4. Review weekly progress updates

---

## Troubleshooting

### Issue: "No mentors found"
**Cause:** Mentor profile not filled correctly  
**Fix:** 
- Mentor must have `mentorship_availability = true`
- Must fill: startup_name, startup_domain, tech_stack, domain_preferences
- Domain/expertise must overlap with student's idea tags/tech

### Issue: "Error fetching requests"
**Cause:** Foreign key issue or user not in profiles table  
**Fix:**
- Check if user exists in `profiles` table
- Verify foreign keys are set up correctly
- Try logging out and logging back in

### Issue: "Match score is 0"
**Cause:** AI scoring failed  
**Fix:**
- Check edge function logs in Cloud → Functions → match-mentors
- Verify LOVABLE_API_KEY is set
- Check if AI model is responding

---

## Sample Test Scenario

**Scenario:** AgriTech Startup Seeking ML Mentor

```
Student Profile:
├─ Name: Rajesh Kumar
├─ Idea: AI Crop Disease Detection
├─ Tags: [AI, ML, Agriculture, IoT]
└─ Tech: [Python, TensorFlow, React Native]

Mentor Profile:
├─ Name: Kiran Sharma
├─ Startup: AgroSense AI
├─ Domain: AgriTech
├─ Expertise: [ML, IoT, MVP Development]
└─ Available: Yes

Expected Match:
├─ Domain Match: 95% ✅
├─ Tech Match: 90% ✅
├─ Stage Match: 85% ✅
├─ Overall: 92% ✅
└─ Reason: "Excellent match! Both focused on AgriTech 
   with ML/IoT. Mentor has direct experience building 
   similar solutions and can guide technical architecture."
```

---

## Next Steps

After testing the basic flow:

1. **Add More Mentors**
   - Create diverse mentor profiles
   - Different domains (FinTech, EdTech, HealthTech)
   - Different expertise levels

2. **Test Edge Cases**
   - Student with no matching mentors
   - Mentor declining requests
   - Multiple mentorship requests

3. **Add Proof Verification**
   - Upload ID documents
   - Admin approval workflow
   - Verified badge on mentor profiles

4. **Enhance Collaboration**
   - Real-time chat
   - Video call integration
   - Document sharing

---

## Quick Reference

| Action | Student | Mentor | Faculty |
|--------|---------|--------|---------|
| Create Ideas | ✅ | ❌ | ❌ |
| Find Mentors | ✅ | ❌ | ❌ |
| Request Mentorship | ✅ | ❌ | ❌ |
| View Requests | ❌ | ✅ | ✅ |
| Accept/Reject | ❌ | ✅ | ✅ |
| Task Management | ✅ | ✅ | ✅ |
| Progress Updates | ✅ | ✅ (view) | ✅ (view) |
| Verify Proofs | ❌ | ❌ | ✅ (admin) |

---

## Support

If you encounter any issues:
1. Check edge function logs in Cloud → Functions
2. Check database tables in Cloud → Database
3. Verify RLS policies are enabled
4. Check browser console for errors

**Need help?** Contact support or check the documentation.
