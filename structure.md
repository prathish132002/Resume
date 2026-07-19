<!--
FILE: structure.md
PURPOSE: Documents the project's folder structure, files, and AI model configurations to aid model context transitions
LAST UPDATED: 2026-07-19
-->

# 📂 ResumeForge Codebase Structure & Architecture Map

Welcome to **ResumeForge**! This document maps out the entire directory structure, component hierarchy, service layers, and AI model integrations of the codebase. It is designed to help any incoming AI agent or developer quickly understand the repository when swapping models or context.

---

## 🛠️ Technology Stack & Dependencies

- **Frontend**: React 19, Vite 6, TypeScript 5.8
- **Styling**: Tailwind CSS 4 (Beta), Framer Motion 12 (Animations), Lucide React (Icons)
- **AI Integrations**: Google Gemini API via serverless edge routing (`@google/generative-ai`)
- **Backend / Authentication**: Firebase Authentication & Cloud Firestore (with persistent offline cache)
- **PDF Engines**: `pdfmake` + `jspdf` + `html2canvas` (for exports), `pdfjs-dist` (for client-side PDF parsing)
- **Charts / Analytics**: Recharts
- **Print utilities**: `react-to-print`

---

## 📂 Project Directory Structure

```
Resume/
├── .env                  # Local environment configuration keys
├── .env.example          # Template showing required variables (Gemini, Firebase)
├── .gitignore            # Excludes node_modules, .env, builds, etc.
├── App.tsx               # Root component: manages main view routing (LOGIN, DASHBOARD, EDITOR, etc.)
├── constants.ts          # Presets: template styles, default (empty) & sample resume structures
├── types.ts              # TypeScript interfaces for Resumes, ATS Results, User Profiles, and Views
├── index.html            # Main HTML entry point
├── index.tsx             # React bootstrap & initialization file
├── index.css             # Tailwind imports and root styling variables
├── interview             # TCS NQT preparation Q&A guide with complete project walkthrough
├── netlify.toml          # Netlify configuration (SPA redirects & secret scanners mapping)
├── vercel.json           # Vercel SPA routing redirects
├── package.json          # Dependency specifications and dev scripts
├── tsconfig.json         # TypeScript compiler configurations
├── vite.config.ts        # Vite build tool and plugins setup (React, Tailwind CSS)
├── api/                  # Backend / Edge Function Route Proxy
│   └── ai.ts             # Vercel/Netlify Edge API routing for Gemini requests
├── components/           # React Components
│   ├── ATSScoreChecker.tsx      # Handles uploading a PDF and obtaining an overall ATS audit score
│   ├── AdminDashboard.tsx      # Admin dashboard for observing usage, requests, and costs
│   ├── CoverLetterGenerator.tsx # Renders a Cover Letter builder & exports PDF/Print templates
│   ├── Dashboard.tsx            # Main user workspace: lists saved resumes, profiles, actions
│   ├── Editor.tsx               # Resume workspace: interactive section forms, AI improvement triggers
│   ├── HistoryModal.tsx         # Displays previous LocalStorage version history for restoration
│   ├── Login.tsx                # Secure Auth wrapper (Email/Password, Google OAuth, Password Reset)
│   ├── Logo.tsx                 # Renders the app logo SVG asset
│   ├── OnboardingTour.tsx       # Interactively guides new users through the editor workspace
│   ├── ResumeImporter.tsx       # Converts unstructured pasted text into Resume JSON with role tailoring
│   ├── ResumePreview.tsx        # Multi-template view generator (ATS_CLASSIC, MODERN, MINIMAL, EXECUTIVE)
│   ├── ResumeSkeleton.tsx       # Skeleton layout loader placeholder
│   ├── RoleGenerator.tsx        # Generates role-based sample resumes from scratch or transforms text
│   ├── UserProfile.tsx          # Settings screen for profile names, email updates, and subscription status
│   └── ui/
│       └── Button.tsx           # Standardized, reusable custom UI Button
├── hooks/
│   └── useAuth.tsx              # React hook listening to Firebase user auth state transitions
└── services/
    ├── aiTrackingService.ts     # Handles request rate-limiting, daily token usage, and Firestore logging
    ├── firebaseConfig.ts        # Bootstraps Firebase App, Authentication, and persistent Firestore cache
    ├── firebaseService.ts       # Authentication operations and CRUD handlers for user profiles & resumes
    ├── geminiService.ts         # Direct API bindings, prompting, caching, and model configurations
    └── storageService.ts        # LocalStorage fallback handlers for profile, resumes, and history
```

---

## 🤖 AI Model Mappings (`geminiService.ts`)

AI requests are routed from components through the backend proxy (`/api/ai` handled by [api/ai.ts](file:///d:/Resume%20Project%20Development/Resume/api/ai.ts)). 
The models are defined in [services/geminiService.ts](file:///d:/Resume%20Project%20Development/Resume/services/geminiService.ts#L3-L9) and mapping is structured as follows:

### 1. Model Definitions
- **`gemini-2.5-flash-lite`** (`MODELS.FLASH_LITE`): Fast and cost-efficient. Used for routine generations, tailoring, summaries, and score checks.
- **`gemini-2.5-flash`** (`MODELS.FLASH`): Mid-tier with high accuracy. Recommended for structured schema parsing.
- **`gemini-2.5-pro`** (`MODELS.PRO`): Advanced reasoning. Used for deep ATS audit reports and complex transformations.

### 2. Method Endpoint Maps

| Function Name | Target Model | Purpose / Prompts | Cache |
| :--- | :--- | :--- | :--- |
| `generateSummary` | `gemini-2.5-flash-lite` | Generates a 3-4 sentence professional summary | Yes (LRU) |
| `improveDescription` | `gemini-2.5-flash-lite` | Refines experience/project bullet points with active verbs | Yes (LRU) |
| `tailorResumeToJob` | `gemini-2.5-flash-lite` | Tailors experience/skills to match a job description strictly | No |
| `transformResumeForRole` | `gemini-2.5-flash-lite` | Optimizes and aligns resume sections for a specific career path | Yes (LRU) |
| `fitResumeToOnePage` | `gemini-2.5-flash-lite` | Trims, combines, and condenses text to fit a single page | Yes (LRU) |
| `parseResumeContent` | `gemini-2.5-flash` | Extracts and maps raw resume text into structured Resume JSON | Yes (LRU) |
| `generateResumeByRole` | `gemini-2.5-flash-lite` | Creates complete dummy resume template for a given role/level | Yes (LRU) |
| `getSkillSuggestions` | `gemini-2.5-flash-lite` | Suggests 15 industry-relevant skills matching a job title | Yes (LRU) |
| `generateCoverLetter` | `gemini-2.5-flash-lite` | Generates salutation, body, and closing letter context | No |
| `calculateATSScore` | `gemini-2.5-flash-lite` | Scores resume out of 100 with recommendations | Yes (LRU) |
| `analyzeResumeFromATS` | `gemini-2.5-pro` | Extracts matched/missing keywords, weaknesses, and suggestions | Yes (LRU) |
| `improveResumeWithAI` | `gemini-2.5-pro` | Rewrites full resume to maximize keyword matches & ATS compliance | Yes (LRU) |

### 3. AI Performance & Optimization Mechanisms
- **Caching**: Non-cryptographic compact hashing of prompt strings creates storage keys. Responses are cached in LocalStorage with a maximum cap of 50 entries, using LRU (Least Recently Used) eviction on overload.
- **Rate-Limiting & Cost Tracking**: Integrated with `aiTrackingService`. Limits users to daily caps (e.g., 20 requests/day for Free users, 200/day for Pro users). A cooldown threshold prevents spamming (minimum 3 seconds between requests).
- **Auto-Retries**: Includes an exponential backoff strategy for rate limits (maximum 3 retry attempts on 429 response codes).

---

## 🔒 Environment Setup & Database Schemas

### 🛠️ Environment Keys (`.env`)
The app expects the following configuration:
```env
GEMINI_API_KEY=                     # Gemini API Access (used server-side/api edge)
VITE_FIREBASE_API_KEY=              # Firebase API Web Key
VITE_FIREBASE_AUTH_DOMAIN=          # Firebase Auth domain
VITE_FIREBASE_PROJECT_ID=           # Project identifier
VITE_FIREBASE_STORAGE_BUCKET=       # Storage bucket endpoint
VITE_FIREBASE_MESSAGING_SENDER_ID=  # Messaging client ID
VITE_FIREBASE_APP_ID=               # Web Application ID
```

### 📂 Firestore Database Collections
1. **`users`** (keyed by `userId`):
   - Stores user profiles (FullName, Email, jobTitle, createdAt, role, plan).
2. **`resumes`** (keyed by `resumeId`):
   - Stores the complete resume schema (personalInfo, education, experience, projects, skills, certifications, achievements, atsResult, userId, updatedAt).
3. **`ai_usage`** (keyed by `userId`):
   - Tracks estimated daily tokens, monthly counts, total requests, and timestamps to enforce limits.
4. **`ai_usage_logs`** (auto-generated ID):
   - Audits individual requests, recording `userId`, `functionName`, `model`, `estimatedTokens`, and `createdAt`.

---

## 🧑‍💻 Architecture Overview & Data Flow

```mermaid
graph TD
    A[App.tsx router] -->|Login Check| B[Login.tsx]
    A -->|Main Hub| C[Dashboard.tsx]
    A -->|Forms & Editing| D[Editor.tsx]
    A -->|ATS Score Audit| E[ATSScoreChecker.tsx]
    A -->|Dynamic Mock Setup| F[RoleGenerator.tsx]
    A -->|Tailored Letters| G[CoverLetterGenerator.tsx]

    D -->|Edits| H[ResumePreview.tsx]
    D -->|Calls| I[geminiService.ts]
    E -->|Calls| I
    F -->|Calls| I
    G -->|Calls| I

    I -->|Limits & Costs| J[aiTrackingService.ts]
    I -->|Secure Forward| K[/api/ai Edge route]
    K -->|Authorized Call| L[Google Gemini API]
    
    C -->|CRUD Resumes| M[firebaseService.ts]
    M -->|Firestore / Local Cache| N[Cloud Firestore]
```
