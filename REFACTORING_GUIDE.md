# AkMEdu Platform - Refactored Structure

## Overview
The monolithic `App.jsx` has been refactored into a clean, modular architecture for better maintainability and scalability.

## Folder Structure

```
src/
├── App.jsx                    # Main app entry point
├── constants/
│   └── curriculum.js          # All curriculum data & totalChapters
├── utils/
│   ├── api.js                 # Groq API calls & JSON repair
│   ├── auth.js                # Password hashing & validation
│   └── supabase.js            # Supabase client & operations
├── hooks/
│   ├── useAuth.js             # Auth state & functions
│   ├── useNavigation.js        # Navigation state management
│   ├── useProgress.js          # Progress tracking
│   └── index.js               # Barrel export
├── components/
│   ├── common/
│   │   ├── ProgressBar.jsx    # Progress bar component
│   │   ├── Badge.jsx          # Badge component
│   │   ├── LoadingScreen.jsx  # Loading animation
│   │   ├── ExamTimer.jsx      # Countdown timer
│   │   └── index.js           # Barrel export
│   └── views/                 # (To be created for views)
│       ├── AuthView.jsx
│       ├── DashboardView.jsx
│       ├── SubjectView.jsx
│       ├── ChapterView.jsx
│       ├── NotesView.jsx
│       ├── QuizView.jsx
│       ├── PaperView.jsx
│       └── ProgressView.jsx
└── styles/
    └── shared.js              # Global & component styles
```

## Benefits

✅ **Separation of Concerns** - Each module has a single responsibility
✅ **Reusability** - Components and hooks can be imported anywhere
✅ **Testability** - Individual functions can be tested in isolation
✅ **Maintainability** - Easy to find and modify specific features
✅ **Scalability** - Simple to add new features without bloating files
✅ **Code Organization** - Clear folder structure makes navigation easy

## Next Steps for Views

The view components (AuthView, DashboardView, etc.) are ready to be created:
1. Extract each view from App.jsx
2. Use the extracted hooks and components
3. Import styles from `shared.js`
4. Create an index.js barrel export in views/

## Key Files Created

| File | Purpose |
|------|---------|
| `constants/curriculum.js` | All 12 subjects with units and chapters |
| `utils/api.js` | Groq API integration & JSON parsing |
| `utils/auth.js` | Password hashing & input validation |
| `utils/supabase.js` | Database operations wrapper |
| `hooks/useAuth.js` | Complete auth state machine |
| `hooks/useNavigation.js` | View & navigation stack management |
| `hooks/useProgress.js` | Progress calculation & saving |
| `components/common/*` | Reusable UI components |
| `styles/shared.js` | All CSS (global + component styles) |

## Import Examples

```javascript
// Import from constants
import { CURRICULUM, totalChapters } from "../constants/curriculum";

// Import from utils
import { callClaude, extractJSON } from "../utils/api";
import { hashPassword, validateUsername } from "../utils/auth";
import { supabase, loginUser, registerUser } from "../utils/supabase";

// Import from hooks
import { useAuth, useNavigation, useProgress } from "../hooks";

// Import from components
import { ProgressBar, Badge, LoadingScreen, ExamTimer } from "../components/common";

// Import styles
import { globalStyles, authStyles } from "../styles/shared";
```

---

**Status**: ✅ Core structure complete. Ready for view components.
