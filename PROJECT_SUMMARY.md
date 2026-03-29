# AkmEdu45 - Smart Study Platform

> **Project Description**: A comprehensive, AI-powered study platform designed specifically for CBSE Class 12 students. It features detailed notes, unlimited contextual quizzes, board-style sample paper generation, detailed progress tracking, and gamified study statistics.

## 1. Architecture & Tech Stack
- **Frontend Framework**: React 18+ (Vite)
- **Styling**: Vanilla CSS utilizing inline dynamic styling and a robust `styles/shared.js` configuration.
- **Design Language**: **Premium Light Glassmorphism** (Frosted glass panels, vibrant gradient accents, #1e293b dark slate typography with highly readable high-contrast interfaces, minimal borders `1px solid rgba(0,0,0,0.05)`, and dynamic micro-animations).
- **Backend/Database**: [Supabase](https://supabase.com) (PostgreSQL)
- **Authentication**: Custom Supabase Email/Password + Resend API integration (Edge Functions) for 6-digit OTP verification.
- **AI Content Generation**: Groq (Llama3 70b/8b) + Anthropic Claude API for generating dynamic study notes, sample papers, and seeding MCQs.

---

## 2. Directory Structure & File Roles

The codebase is strictly modularized into functional zones to ensure high maintainability.

### 2.1 Core Application (`/src`)
- `App.jsx`: The heart of the application. It acts as the global state machine (combining routing via `nav.view`, content generation state, and orchestrating Top-Level Views).
- `main.jsx`: The React mount entry point.

### 2.2 Global State & Hooks (`/src/hooks`)
- `useAuth.js`: Manages the entire authentication lifecycle, credentials, session states, Reset Password flows, and login logic utilizing localStorage and Supabase.
- `useNavigation.js`: A custom view-stack based router (`nav.view`, `nav.subject`, `nav.chapter`) enabling back-button logic without React Router.
- `useProgress.js`: Handles caching and syncing of all user learning progress (reading notes, quiz scores, avatars) directly to the Supabase JSON `progress` table.
- `useTheme.js`: (Reserved) Currently locked into the Premium Light style system but tracks global window dimension structures.

### 2.3 Application Views (`/src/components/views`)
*These components represent the primary "pages" navigated to by the user.*
- `AuthView.jsx`: The comprehensive login, register, verify OTP, and forgot-password interface.
- `DashboardView.jsx`: The home screen showing recent chapters, login streaks, overall curriculum progress, and subject grid.
- `SubjectView.jsx`: Displays units/chapters inside a specific subject.
- `ChapterView.jsx`: The landing zone for a chapter, allowing the user to select either "Notes" or "Quizzes".
- `NotesView.jsx`: Displays Claude-generated Markdown study materials.
- `QuizSetsView.jsx`: Displays the available 15 quiz sets per chapter. Enforces a 10/10/10 (Easy/Medium/Hard) ratio for a total of 30 questions per set.
- `QuizView.jsx`: The interactive MCQ taking interface. Evaluates answers visually.
- `PapersListView.jsx` & `PaperView.jsx`: Handles selection and generation of full-length board examination sample papers.
- `ProfileView.jsx`: Allows users to update their customized name, avatar (stored via progress table JSON to avoid schema migrations), and change passwords.
- `ProgressView.jsx` & `StatsView.jsx`: Renders deep analytical breakdown of the student's learning efficiency.

### 2.4 Common Utilities (`/src/components/common`)
- `FloatingForumButton.jsx`: A globally available chat/forum button pinned to the bottom right.
- `SearchBar.jsx`: Algorithmic search bar navigating instantly to subjects/chapters.
- `WeakTopicsReport.jsx`: Aggregates failed quiz questions to highlight areas needing revision.

### 2.5 Backend Services & Data Logic (`/src/utils`)
- `supabase.js`: Contains all standard CRUD wrappers for interacting with the Supabase database.
- `api.js`: Wrappers for calling Claude/Groq endpoints directly from the browser context when fallbacks are needed.
- `auth.js` / `passwordValidation.js`: Cryptographic hashing and strict strength requirements logic.
- `weakTopics.js`: Algorithm that tracks consecutive incorrect answers mapped to chapters.
- `cacheManager.js`: Client-side caching to prevent redundant API calls to expensive AI text models.
- `loginStreak.js`: Time-based calculation for determining daily platform usage streaks.

### 2.6 Database Automation & Seed Scripts (`/src/scripts`)
*Node.js scripts run directly from the terminal via `node src/scripts/[script].js` to pre-populate the cloud database.*
- `topUpTo5.js`: The most critical script. Automates iterating over all 182 chapters across subjects and utilizes AI to guarantee there are exactly 15 unique Quiz Sets in the database per chapter, ensuring a strict 10 (Easy) / 10 (Medium) / 10 (Hard) distribution.
- `generateUltraDetailedNotes.js`: Generates comprehensive markdown study materials for offline seed caching.
- `monitorDb.js`: Utility script to check how many chapters are missing required quiz sets.

---

## 3. Database Schema Overview (Supabase)

### `users`
Tracks core user identity.
| Column | Type | Description |
|--------|------|-------------|
| `username` | text (PK) | Primary Key, distinct handle |
| `email` | text | Used for Auth and OTP |
| `name` | text | Display Name (editable via Profile) |
| `password_hash` | text | SHA-256 hashed password |
| `email_verified`| boolean | Tracks OTP completion |

### `progress`
Generic JSON document store for incredibly fast metric updates without table migrations.
| Column | Type | Description |
|--------|------|-------------|
| `username` | text (PK) | Foreign Key -> `users.username` |
| `subject` | text (PK) | e.g. "Physics". If system data (avatars), uses "SYSTEM" |
| `chapter` | text (PK) | e.g. "Electric Charges". If system, uses "PROFILE" |
| `type` | text (PK) | Identifies data format (e.g. `quiz`, `notes`, `avatar`, `name`) |
| `data` | jsonb | The mutable payload object |

### `quiz_sets`
Stores the seeded MCQs generated by the AI scripts.
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Unique ID |
| `subject` | text | Tied to curriculum constants |
| `chapter` | text | Tied to curriculum constants |
| `set_number` | integer | Logical set (1 to 15) |
| `questions` | jsonb | Array of 30 structured MCQ objects |

### `user_quiz_submissions`
Tracks historical scores and validates progress locking.
| Column | Type | Description |
|--------|------|-------------|
| `username` | text | User taking the quiz |
| `subject` | text | Subject name |
| `chapter` | text | Chapter name |
| `set_number` | integer | The set they attempted |
| `score` | integer | Score out of 30 |

---

## 4. Operational Directives for AI Assistance
When executing future modifications on this codebase, adhere strictly to the following parameters:
1. **Design Confinement**: NEVER revert the UI back to dark themes or high-contrast neon styling. Stick strictly to `rgba(255,255,255,0.8)` panels with `#1e293b` text. 
2. **Avatar/Profile Strategy**: Do NOT add new columns to the `users` table for custom fields (e.g., Avatars, bios, display name overrides). Always harness the `progress` table JSON schema under `subject: 'SYSTEM'` keys to maximize flexibility.
3. **Seeding Validation**: If requested to tweak quiz outputs, refer directly to `src/scripts/topUpTo5.js`. It utilizes advanced chunking arrays and concurrency limitations to respect LLM Token limits.
