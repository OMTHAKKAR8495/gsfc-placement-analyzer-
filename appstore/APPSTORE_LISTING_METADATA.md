# 🍎 Apple App Store Listing & Submission Guide
> **Official Metadata, Privacy Disclosures, & App Store Connect Assets for GSFC University Placement Portal**

---

## 📄 1. App Store Connect Listing Metadata

* **App Name**: `GSFC Placement Portal` (22 / 30 chars)
* **Subtitle**: `AI Placement & Interview Suite` (30 / 30 chars)
* **Bundle Identifier**: `edu.gsfcuniversity.placementportal`
* **SKU**: `GSFC-PLACEMENT-IOS-1`
* **Primary Category**: `Education`
* **Secondary Category**: `Business`

---

## 📝 2. Promotional & Description Text

* **Promotional Text**: `Experience AI-powered resume scoring, live campus drives, and 24/7 mock interview coaching at GSFC University.`
* **Full Description**:
```markdown
The official GSFC University Placement Portal (CampusHire AI) connects students, corporate recruiters, and Training & Placement Cell (TPC) officers into a single AI-driven ecosystem.

KEY FEATURES FOR STUDENTS:
- Smart Resume Analyzer: Get instant 100-point ATS compliance scoring and technical skill extraction powered by Gemini AI & NLP.
- 24/7 AI Mock Interview Studio: Practice technical & HR interviews with voice recognition, STAR framework scoring, and answer feedback.
- Live GSFC Drive Tracker: View active recruitment drives, filter by program/CGPA eligibility, and track your application status.

FOR CORPORATE RECRUITERS:
- Ranked Candidate Leaderboard: Filter applicants instantly by NLP match index.
- Practice Question Gate: Publish role-specific question banks for registered candidates.

FOR TPC ADMIN OFFICERS:
- NAAC & NIRF CSV Exporters: Audit-ready placement metrics generation.
- Role-Scoped Governance: Secure access model for students, recruiters, and administrators.
```

---

## 🔐 3. App Privacy & Data Safety Declarations

* **Data Collected**:
  - `Contact Info` ➔ Name, Email Address (App Functionality)
  - `User Content` ➔ Resumes, ATS Scores, Mock Interview Recordings (App Functionality)
* **Data Tracking**: **No data collected is used to track users across third-party apps or websites.**

---

## 🛠️ 4. Build, Archive & TestFlight Commands

### Step 1: Compile Production Web Bundle & Sync iOS Workspace
```bash
npm --prefix frontend run build:ios
```

### Step 2: Open Xcode Workspace
```bash
npx cap open ios
```
*(Note: Always open `frontend/ios/App/App.xcworkspace`, never the `.xcodeproj` file!)*

### Step 3: Archive & Upload to TestFlight
In Xcode:
1. Select target **Any iOS Device (arm64)**.
2. Select **Product ➔ Archive**.
3. Once Archive completes, click **Validate App** and then **Distribute App** to upload to App Store Connect.
