export const globalStyles = `
  /* ===== DESIGN TOKENS ===== */
  :root {
    /* Color Palette */
    --bg-app: #f5f4ff;
    --bg-card: #ffffff;
    --bg-card-hover: #f8f8ff;
    --primary: #4f46e5;
    --primary-dark: #3730a3;
    --primary-light: #ede9fe;
    --primary-muted: rgba(79, 70, 229, 0.08);
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-tertiary: #94a3b8;
    --text-label: #64748b;
    --border: rgba(0, 0, 0, 0.06);
    --border-card: rgba(0, 0, 0, 0.07);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.10);
    --shadow-card: 0 2px 12px rgba(79, 70, 229, 0.06);

    /* Accent Colors */
    --green: #10b981;
    --green-light: #ecfdf5;
    --orange: #f97316;
    --orange-light: #fff7ed;
    --amber: #f59e0b;
    --red: #ef4444;
    --red-light: #fef2f2;
    --blue: #3b82f6;
    --blue-light: #eff6ff;
    --cyan: #06b6d4;

    /* Typography */
    --font: 'Outfit', 'Inter', -apple-system, sans-serif;
    --fs-xs: 11px;
    --fs-sm: 12px;
    --fs-base: 14px;
    --fs-md: 16px;
    --fs-lg: 18px;
    --fs-xl: 22px;
    --fs-2xl: 26px;

    /* Spacing */
    --sp-xs: 6px;
    --sp-sm: 10px;
    --sp-md: 14px;
    --sp-lg: 18px;
    --sp-xl: 24px;
    --sp-2xl: 36px;

    /* Border Radius */
    --r-sm: 8px;
    --r-md: 12px;
    --r-lg: 16px;
    --r-xl: 20px;
    --r-2xl: 24px;
    --r-full: 9999px;

    /* Nav heights */
    --top-nav-h: 56px;
    --bottom-nav-h: 60px;
  }

  /* ===== DARK MODE TOKENS ===== */
  @media (prefers-color-scheme: dark) {
    :root {
      --bg-app: #0f0e1a;
      --bg-card: #1a1828;
      --bg-card-hover: #211f30;
      --primary-light: rgba(79, 70, 229, 0.18);
      --primary-muted: rgba(79, 70, 229, 0.12);
      --text-primary: #f1f5f9;
      --text-secondary: #cbd5e1;
      --text-tertiary: #64748b;
      --text-label: #94a3b8;
      --border: rgba(255, 255, 255, 0.07);
      --border-card: rgba(255, 255, 255, 0.08);
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
      --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
      --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
      --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.3);
      --green-light: rgba(16, 185, 129, 0.12);
      --orange-light: rgba(249, 115, 22, 0.12);
      --red-light: rgba(239, 68, 68, 0.12);
      --blue-light: rgba(59, 130, 246, 0.12);
    }
  }

  /* ===== GLOBAL RESET & BASE ===== */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; width: 100%; overflow-x: hidden; }
  body {
    width: 100%;
    font-family: var(--font);
    background: var(--bg-app);
    color: var(--text-primary);
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    -webkit-font-smoothing: antialiased;
  }
  #root {
    width: 100%;
    min-height: 100dvh;
    background: var(--bg-app);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }
  button { cursor: pointer; font-family: var(--font); transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }

  /* ===== CARD COMPONENT ===== */
  .card {
    background: var(--bg-card);
    border-radius: var(--r-xl);
    border: 1px solid var(--border-card);
    padding: var(--sp-lg);
    box-shadow: var(--shadow-card);
    width: 100%;
    max-width: 100%;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .card:hover {
    box-shadow: 0 6px 24px rgba(79, 70, 229, 0.12);
    transform: translateY(-2px);
  }
  .hover-lift:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(79, 70, 229, 0.14);
  }

  /* ===== BADGE / PILL ===== */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: var(--r-full);
    font-size: var(--fs-xs);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .badge-primary { background: var(--primary-light); color: var(--primary); }
  .badge-green { background: var(--green-light); color: var(--green); }
  .badge-orange { background: var(--orange-light); color: var(--orange); }
  .badge-red { background: var(--red-light); color: var(--red); }

  /* ===== QUIZ OPTION BUTTONS ===== */
  .opt-btn {
    width: 100%; text-align: left; padding: 14px 16px; border-radius: var(--r-lg);
    border: 1.5px solid var(--border);
    background: var(--bg-card);
    color: var(--text-primary); font-size: var(--fs-base); font-weight: 500; line-height: 1.65;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); min-height: 52px; word-wrap: break-word;
    box-shadow: var(--shadow-sm);
    display: flex; align-items: center; gap: 12;
  }
  .opt-btn:hover {
    border-color: var(--primary);
    background: var(--primary-muted);
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.1);
  }
  .opt-selected {
    border-color: var(--primary) !important;
    background: var(--primary-light) !important;
    color: var(--primary-dark) !important;
    font-weight: 600;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) !important;
  }
  .opt-correct {
    border-color: var(--green) !important;
    background: var(--green-light) !important;
    color: #047857 !important;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
  }
  .opt-wrong {
    border-color: var(--red) !important;
    background: var(--red-light) !important;
    color: #b91c1c !important;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
  }
  .opt-letter {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; border: 1.5px solid currentColor;
    opacity: 0.55;
  }

  /* ===== QUIZ PROGRESS BAR ===== */
  .quiz-progress-bar {
    height: 5px; background: var(--border); border-radius: var(--r-full);
    overflow: hidden; margin-bottom: 16px;
  }
  .quiz-progress-fill {
    height: 100%; border-radius: var(--r-full);
    background: linear-gradient(90deg, var(--primary), #818cf8);
    transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
  }

  /* ===== MAIN LAYOUT ===== */
  .main-content {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--sp-md) var(--sp-md) calc(var(--bottom-nav-h) + 24px + env(safe-area-inset-bottom));
    position: relative;
    z-index: 10;
    flex: 1;
    width: 100%;
  }

  /* ===== GRIDS ===== */
  .dash-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .subj-ch-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
  .chapter-hub-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
  .prog-summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr)); gap: 12px; margin-bottom: 24px; }
  .prog-ch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr)); gap: 10px; }

  /* ===== TOP NAVIGATION ===== */
  .top-header {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(79, 70, 229, 0.08);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 1px 12px rgba(79, 70, 229, 0.06);
    flex-shrink: 0;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
  }
  @media (prefers-color-scheme: dark) {
    .top-header {
      background: rgba(26, 24, 40, 0.95);
      border-bottom-color: rgba(255,255,255,0.07);
      box-shadow: 0 1px 12px rgba(0,0,0,0.3);
    }
  }
  .top-header-inner {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 var(--sp-md);
    height: var(--top-nav-h);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-sm);
  }
  .top-header-title {
    font-size: var(--fs-md);
    font-weight: 800;
    color: var(--primary);
    letter-spacing: -0.02em;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }
  .top-header-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: var(--r-md);
    background: transparent;
    border: none;
    color: var(--primary);
    font-size: 20px;
    font-weight: 600;
    flex-shrink: 0;
    padding: 0;
  }
  .top-header-back:hover { background: var(--primary-muted); }
  .streak-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--orange-light);
    border: none;
    border-radius: var(--r-full);
    padding: 4px 10px;
    font-size: 13px;
    font-weight: 800;
    color: var(--orange);
    flex-shrink: 0;
    cursor: default;
  }
  .avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), #818cf8);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 13px;
    flex-shrink: 0;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
    transition: all 0.2s;
  }
  .avatar-circle:hover { transform: scale(1.05); }

  /* ===== MOBILE BOTTOM NAVIGATION (Redesigned) ===== */
  .mobile-bottom-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.97);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-top: 1px solid rgba(79, 70, 229, 0.08);
    justify-content: space-around;
    align-items: center;
    padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
    z-index: 100;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
    height: calc(var(--bottom-nav-h) + env(safe-area-inset-bottom));
  }
  @media (prefers-color-scheme: dark) {
    .mobile-bottom-nav {
      background: rgba(26, 24, 40, 0.97);
      border-top-color: rgba(255,255,255,0.07);
    }
  }
  .nav-desktop-links { display: flex; }
  @media (max-width: 768px) {
    .nav-desktop-links { display: none !important; }
    .mobile-bottom-nav { display: flex !important; }
    .nav-bar > div:nth-child(2) { display: none !important; }
  }
  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    min-width: 52px;
    padding: 5px 6px 3px;
    border-radius: var(--r-lg);
    transition: all 0.2s;
    position: relative;
  }
  /* Active state: colored icon + dot, NO background fill */
  .bottom-nav-item.active {
    color: var(--primary);
    background: transparent;
    box-shadow: none;
  }
  .bottom-nav-item.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 18px;
    height: 3px;
    border-radius: 2px 2px 0 0;
    background: var(--primary);
  }
  .bottom-nav-item:not(.active):active {
    background: var(--primary-muted);
    color: var(--primary);
  }
  .bottom-nav-icon {
    width: 24px;
    height: 24px;
    stroke-width: 2;
    transition: all 0.2s;
  }
  .bottom-nav-item.active .bottom-nav-icon {
    stroke-width: 2.5;
  }
  .bottom-nav-label {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  /* ===== SECTION LABELS ===== */
  .section-label {
    font-size: var(--fs-sm);
    font-weight: 800;
    color: var(--text-label);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: var(--sp-sm);
  }

  /* ===== PROGRESS BARS ===== */
  .progress-track {
    height: 5px;
    background: rgba(0,0,0,0.07);
    border-radius: var(--r-full);
    overflow: hidden;
  }
  @media (prefers-color-scheme: dark) {
    .progress-track { background: rgba(255,255,255,0.1); }
  }
  .progress-fill {
    height: 100%;
    border-radius: var(--r-full);
    background: linear-gradient(90deg, var(--primary), #818cf8);
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ===== SEARCH BAR ===== */
  .search-pill {
    width: 100%;
    background: var(--bg-card);
    border: 1.5px solid var(--border-card);
    border-radius: var(--r-full);
    padding: 11px 18px;
    font-size: var(--fs-base);
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
    outline: none;
    transition: all 0.2s;
  }
  .search-pill::placeholder { color: var(--text-tertiary); }
  .search-pill:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
  }

  /* ===== DASHBOARD — NEW ===== */
  .dash-greeting {
    font-size: var(--fs-lg);
    font-weight: 900;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin-bottom: 2px;
  }
  .dash-subline {
    font-size: var(--fs-sm);
    color: var(--text-tertiary);
    font-weight: 500;
  }
  .dash-hero {
    background: var(--bg-card);
    border-radius: var(--r-xl);
    padding: 16px;
    border: 1px solid var(--border-card);
    box-shadow: var(--shadow-card);
    margin-bottom: 16px;
  }
  @media (prefers-color-scheme: dark) {
    .dash-hero { background: var(--bg-card); border-color: var(--border-card); }
  }
  .subject-chips-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
    scrollbar-width: none;
  }
  .subject-chips-scroll::-webkit-scrollbar { display: none; }
  .subject-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: var(--r-full);
    background: var(--bg-card);
    border: 1.5px solid var(--border-card);
    font-size: 12px;
    font-weight: 700;
    color: var(--text-secondary);
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: var(--shadow-sm);
    flex-shrink: 0;
  }
  .subject-chip:active { transform: scale(0.97); }

  /* ===== TODAY'S PLAN ===== */
  .today-plan-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.2s;
  }
  .today-plan-item:last-child { border-bottom: none; }
  .today-plan-dot {
    width: 8px; height: 8px; border-radius: 50%;
    flex-shrink: 0;
  }

  /* ===== CONTINUE LEARNING CARD ===== */
  .continue-card {
    background: var(--bg-card);
    border-radius: var(--r-xl);
    border: 1px solid var(--border-card);
    box-shadow: var(--shadow-card);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: left;
    padding: 0;
    border: none;
  }
  .continue-card:hover { box-shadow: 0 6px 24px rgba(79, 70, 229, 0.12); }

  /* ===== SUBJECT MINI CARDS ===== */
  .subject-mini-card {
    background: var(--bg-card);
    border-radius: var(--r-xl);
    border: 1px solid var(--border-card);
    padding: 14px;
    box-shadow: var(--shadow-card);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    min-height: 110px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .subject-mini-card:active { transform: scale(0.98); }
  .subject-icon-box {
    width: 40px;
    height: 40px;
    border-radius: var(--r-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  /* ===== DAILY TIP BANNER ===== */
  .tip-banner {
    background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
    border-radius: var(--r-xl);
    padding: 14px 16px;
    color: white;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.25);
  }
  .tip-icon-circle {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }

  /* ===== COLLAPSIBLE UNIT GROUPS (SubjectView) ===== */
  .unit-group {
    background: var(--bg-card);
    border-radius: var(--r-xl);
    border: 1px solid var(--border-card);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    margin-bottom: 10px;
  }
  .unit-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 16px;
    cursor: pointer;
    transition: background 0.15s;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
  }
  .unit-group-header:active { background: var(--primary-muted); }
  .unit-group-chevron {
    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  .unit-group-chevron.open { transform: rotate(180deg); }
  .unit-group-body {
    overflow: hidden;
    transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  .chapter-row-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 16px;
    border-top: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.15s;
    background: transparent;
    border-left: none; border-right: none; border-bottom: none;
    width: 100%; text-align: left;
  }
  .chapter-row-item:active { background: var(--primary-muted); }
  .chapter-row-item.active-ch { border-left: 3px solid var(--primary); padding-left: 13px; }

  /* ===== STUDY HUB CARDS ===== */
  .hub-card {
    background: var(--bg-card);
    border-radius: var(--r-xl);
    border: 1px solid var(--border-card);
    padding: 20px;
    box-shadow: var(--shadow-card);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    position: relative;
    overflow: hidden;
    width: 100%;
  }
  .hub-card:active { transform: scale(0.98); }
  .hub-card-icon {
    width: 44px; height: 44px; border-radius: var(--r-lg);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 12px; flex-shrink: 0;
  }

  /* ===== CURRICULUM LIST (Subject View) ===== */
  .curriculum-row {
    background: var(--bg-card);
    border-radius: var(--r-xl);
    border: 1px solid var(--border-card);
    padding: 14px 16px;
    box-shadow: var(--shadow-card);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
  }
  .curriculum-row:active { transform: scale(0.99); background: var(--bg-card-hover); }
  .curriculum-row.active-chapter { border-left: 3px solid var(--primary); }
  .chapter-icon-box {
    width: 38px; height: 38px; border-radius: var(--r-md);
    background: var(--primary-muted);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }

  /* ===== MASTERY CARD (Subject Hero) ===== */
  .mastery-card {
    background: var(--bg-card);
    border-radius: var(--r-2xl);
    border: 1px solid var(--border-card);
    padding: 18px;
    box-shadow: var(--shadow-card);
    margin-bottom: 16px;
  }

  /* ===== NOTES CONTENT ===== */
  .notes-content-pad { padding: clamp(14px, 4vw, 28px) clamp(12px, 3vw, 22px); }
  .prose-notes-block {
    background: var(--bg-card);
    border-radius: var(--r-2xl);
    border: 1px solid var(--border-card);
    overflow: hidden;
    box-shadow: var(--shadow-card);
    color: var(--text-primary);
  }
  .prose-notes { line-height: 1.8; color: var(--text-secondary); font-size: var(--fs-base); font-weight: 400; }
  .prose-notes h1 { font-size: 22px; font-weight: 900; color: var(--text-primary); margin: 0 0 8px; letter-spacing: -0.02em; line-height: 1.2; }
  .prose-notes h2 { font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 2px solid var(--border); }
  .prose-notes h3 { font-size: 13px; font-weight: 700; color: var(--primary); margin: 18px 0 8px; text-transform: uppercase; letter-spacing: 0.06em; }
  .prose-notes p { margin: 0 0 12px; }
  .prose-notes hr { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
  .prose-notes strong { color: var(--text-primary); font-weight: 700; }
  .prose-notes li { margin-bottom: 6px; padding-left: 4px; }
  .prose-notes ul, .prose-notes ol { padding-left: 22px; margin: 8px 0 14px; }
  .prose-notes code {
    background: var(--primary-muted); color: var(--primary); padding: 2px 6px;
    border-radius: 5px; font-size: 12px; font-family: monospace; font-weight: 600;
  }
  .prose-notes blockquote {
    border-left: 3px solid var(--primary);
    background: var(--primary-muted);
    padding: 12px 16px;
    border-radius: 0 var(--r-md) var(--r-md) 0;
    margin: 18px 0;
    color: var(--text-secondary);
    font-style: italic;
  }

  /* ===== SKELETON SHIMMER ===== */
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .skeleton {
    border-radius: var(--r-md);
    background: linear-gradient(90deg, var(--border) 25%, rgba(255,255,255,0.15) 50%, var(--border) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @media (prefers-color-scheme: dark) {
    .skeleton {
      background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%);
      background-size: 200% 100%;
    }
  }

  /* ===== OFFLINE BANNER ===== */
  .offline-banner {
    position: fixed;
    top: var(--top-nav-h);
    left: 0; right: 0;
    background: #1e293b;
    color: #e2e8f0;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 700;
    text-align: center;
    z-index: 99;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    animation: slideDown 0.25s ease;
  }

  /* ===== SWIPE EDGE INDICATOR ===== */
  .swipe-edge-indicator {
    position: fixed;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    background: linear-gradient(to right, rgba(79,70,229,0.4), transparent);
    z-index: 200;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .swipe-edge-indicator.visible { opacity: 1; }

  /* ===== WEAK TOPICS ===== */
  .weak-topic-bar-track {
    height: 4px;
    background: rgba(0,0,0,0.07);
    border-radius: var(--r-full);
    overflow: hidden;
    margin-top: 6px;
  }

  /* ===== ANIMATIONS ===== */
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes exitConfirmSlideUp {
    from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.95); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }
  @keyframes cvFadeIn {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 768px) {
    .main-content { padding: var(--sp-sm) var(--sp-sm) calc(var(--bottom-nav-h) + 20px + env(safe-area-inset-bottom)); }
    .dash-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  }
  @media (max-width: 360px) {
    .main-content { padding: 8px 8px calc(var(--bottom-nav-h) + 16px + env(safe-area-inset-bottom)); }
  }
  @media (min-width: 769px) {
    .main-content { padding: var(--sp-xl) var(--sp-xl) var(--sp-xl); max-width: 900px; }
    .dash-grid { grid-template-columns: repeat(4, 1fr); }
    .subj-ch-grid { grid-template-columns: 1fr 1fr; }
    .chapter-hub-grid { grid-template-columns: 1fr 1fr; }
  }

  /* floating forum safe area */
  @supports (bottom: env(safe-area-inset-bottom)) {
    .floating-forum-btn {
      bottom: calc(70px + env(safe-area-inset-bottom));
    }
  }
`;

export const authStyles = `
  /* Kept for backward compatibility */
`;
