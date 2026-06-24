export const globalStyles = `
  /* ===== DESIGN TOKENS ===== */
  :root {
    /* Color Palette */
    --bg-app: linear-gradient(160deg, #f0f0ff 0%, #e8e8ff 100%);
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
    --orange: #f59e0b;
    --orange-light: #fffbeb;
    --red: #ef4444;
    --red-light: #fef2f2;
    --blue: #3b82f6;
    --blue-light: #eff6ff;
    
    /* Typography */
    --font: 'Outfit', 'Inter', -apple-system, sans-serif;
    --fs-xs: 11px;
    --fs-sm: 13px;
    --fs-base: 15px;
    --fs-md: 17px;
    --fs-lg: 20px;
    --fs-xl: 24px;
    --fs-2xl: 28px;
    --fs-3xl: 32px;
    
    /* Spacing */
    --sp-xs: 6px;
    --sp-sm: 10px;
    --sp-md: 16px;
    --sp-lg: 20px;
    --sp-xl: 28px;
    --sp-2xl: 40px;
    
    /* Border Radius */
    --r-sm: 8px;
    --r-md: 12px;
    --r-lg: 16px;
    --r-xl: 20px;
    --r-2xl: 24px;
    --r-full: 9999px;
  }

  /* ===== GLOBAL RESET & BASE ===== */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; width: 100%; overflow-x: hidden; }
  body {
    width: 100%;
    font-family: var(--font);
    background: #eef0ff;
    color: var(--text-primary);
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    -webkit-font-smoothing: antialiased;
  }
  #root {
    width: 100%;
    min-height: 100dvh;
    background: linear-gradient(160deg, #f0f0ff 0%, #e8e8ff 100%);
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
    padding: 4px 10px;
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
    width: 100%; text-align: left; padding: 16px 20px; border-radius: var(--r-lg);
    border: 1.5px solid var(--border);
    background: var(--bg-card);
    color: var(--text-primary); font-size: var(--fs-base); font-weight: 500; line-height: 1.6;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); min-height: 48px; word-wrap: break-word;
    box-shadow: var(--shadow-sm);
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

  /* ===== QUESTION NUMBERS ===== */
  .qnum {
    width: 38px; height: 38px; border-radius: var(--r-sm); border: 1.5px solid var(--border);
    font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    background: var(--bg-card); color: var(--text-label);
  }
  .qnum:hover {
    transform: scale(1.1);
    background: var(--primary-light); border-color: var(--primary); color: var(--primary);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
  }
  .qnum-active { background: var(--primary-light); border-color: var(--primary); color: var(--primary); }

  /* ===== MAIN LAYOUT ===== */
  .main-content {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--sp-lg) var(--sp-md) calc(88px + env(safe-area-inset-bottom));
    position: relative;
    z-index: 10;
    flex: 1;
    width: 100%;
  }

  /* ===== GRIDS ===== */
  .dash-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .subj-ch-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
  .chapter-hub-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .prog-summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr)); gap: 12px; margin-bottom: 24px; }
  .prog-ch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr)); gap: 10px; }

  /* ===== TOP NAVIGATION (New Design) ===== */
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
  .top-header-inner {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 var(--sp-md);
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-sm);
  }
  .top-header-title {
    font-size: var(--fs-lg);
    font-weight: 800;
    color: var(--primary);
    letter-spacing: -0.02em;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .top-header-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--r-md);
    background: transparent;
    border: none;
    color: var(--primary);
    font-size: 22px;
    font-weight: 600;
    flex-shrink: 0;
    padding: 0;
  }
  .top-header-back:hover {
    background: var(--primary-muted);
  }
  .streak-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    border: none;
    font-size: var(--fs-base);
    font-weight: 800;
    color: var(--text-primary);
    flex-shrink: 0;
    padding: 0;
    cursor: default;
  }
  .avatar-circle {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), #818cf8);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 15px;
    flex-shrink: 0;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
    transition: all 0.2s;
  }
  .avatar-circle:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  }

  /* ===== MOBILE BOTTOM NAVIGATION (New Design) ===== */
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
    padding: 8px 16px calc(8px + env(safe-area-inset-bottom));
    z-index: 100;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
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
    gap: 3px;
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    min-width: 52px;
    min-height: 52px;
    padding: 6px 8px;
    border-radius: var(--r-lg);
    transition: all 0.2s;
  }
  .bottom-nav-item.active {
    background: var(--primary);
    color: white;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  }
  .bottom-nav-item:not(.active):hover {
    background: var(--primary-muted);
    color: var(--primary);
  }
  .bottom-nav-icon {
    width: 22px;
    height: 22px;
    stroke-width: 2;
  }
  .bottom-nav-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  /* ===== OLD NAV BAR (desktop) ===== */
  .nav-bar {
    max-width: 1140px; margin: 0 auto; padding: 0 var(--sp-xl); height: 70px;
    display: flex; align-items: center; justify-content: space-between; gap: var(--sp-lg);
  }
  .nav-username { display: block; font-weight: 700; color: var(--text-primary); font-size: var(--fs-sm); }
  .nav-brand { font-size: 20px !important; }
  .nav-btn-text { display: inline; font-size: var(--fs-sm); }

  /* ===== SECTION LABELS ===== */
  .section-label {
    font-size: var(--fs-sm);
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.01em;
    margin-bottom: var(--sp-sm);
  }

  /* ===== PROGRESS BARS ===== */
  .progress-track {
    height: 6px;
    background: rgba(0,0,0,0.07);
    border-radius: var(--r-full);
    overflow: hidden;
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
    background: white;
    border: 1.5px solid var(--border);
    border-radius: var(--r-full);
    padding: 12px 20px;
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

  /* ===== DASHBOARD ===== */
  .dash-overall {
    display: none; /* Hidden in new design */
  }
  .dash-overall-stats { display: flex; gap: 20px; flex-wrap: wrap; }

  /* ===== CONTINUE LEARNING CARD ===== */
  .continue-card {
    background: white;
    border-radius: var(--r-xl);
    border: 1px solid var(--border-card);
    padding: 20px;
    box-shadow: var(--shadow-card);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
  }
  .continue-card:hover {
    box-shadow: 0 6px 24px rgba(79, 70, 229, 0.12);
    transform: translateY(-2px);
  }

  /* ===== SUBJECT MINI CARDS ===== */
  .subject-mini-card {
    background: white;
    border-radius: var(--r-xl);
    border: 1px solid var(--border-card);
    padding: 16px;
    box-shadow: var(--shadow-card);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .subject-mini-card:hover {
    box-shadow: 0 6px 24px rgba(79, 70, 229, 0.12);
    transform: translateY(-2px);
  }
  .subject-icon-box {
    width: 48px;
    height: 48px;
    border-radius: var(--r-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
  }

  /* ===== DAILY TIP BANNER ===== */
  .tip-banner {
    background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
    border-radius: var(--r-xl);
    padding: 20px;
    color: white;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3);
  }
  .tip-icon-circle {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  /* ===== STUDY HUB CARDS ===== */
  .hub-card {
    background: white;
    border-radius: var(--r-xl);
    border: 1px solid var(--border-card);
    padding: 24px;
    box-shadow: var(--shadow-card);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    position: relative;
    overflow: hidden;
    width: 100%;
  }
  .hub-card:hover {
    box-shadow: 0 8px 32px rgba(79, 70, 229, 0.14);
    transform: translateY(-3px);
  }
  .hub-card-icon {
    width: 52px;
    height: 52px;
    border-radius: var(--r-lg);
    background: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 16px;
    flex-shrink: 0;
  }
  .hub-card-watermark {
    position: absolute;
    right: -10px;
    bottom: -10px;
    width: 80px;
    height: 80px;
    opacity: 0.05;
    font-size: 80px;
    line-height: 1;
    pointer-events: none;
  }
  .hub-cta {
    font-size: var(--fs-xs);
    font-weight: 800;
    color: var(--primary);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ===== CURRICULUM LIST (Subject View) ===== */
  .curriculum-row {
    background: white;
    border-radius: var(--r-xl);
    border: 1px solid var(--border-card);
    padding: 16px 18px;
    box-shadow: var(--shadow-card);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
  }
  .curriculum-row:hover {
    box-shadow: 0 6px 24px rgba(79, 70, 229, 0.12);
    transform: translateX(2px);
  }
  .curriculum-row.active-chapter {
    border-left: 3px solid var(--primary);
  }
  .chapter-icon-box {
    width: 42px;
    height: 42px;
    border-radius: var(--r-md);
    background: var(--primary-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  /* ===== MASTERY CARD (Subject Hero) ===== */
  .mastery-card {
    background: white;
    border-radius: var(--r-2xl);
    border: 1px solid var(--border-card);
    padding: 24px;
    box-shadow: var(--shadow-card);
    margin-bottom: 24px;
  }

  /* ===== NOTES CONTENT ===== */
  .notes-content-pad { padding: clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px); }
  .prose-notes-block {
    background: white;
    border-radius: var(--r-2xl);
    border: 1px solid var(--border-card);
    overflow: hidden;
    box-shadow: var(--shadow-card);
    color: var(--text-primary);
  }
  .prose-notes { line-height: 1.8; color: var(--text-secondary); font-size: var(--fs-base); font-weight: 400; }
  .prose-notes h1 { font-size: 26px; font-weight: 900; color: var(--text-primary); margin: 0 0 8px; letter-spacing: -0.02em; line-height: 1.2; }
  .prose-notes h2 {
    font-size: 17px; font-weight: 800; color: var(--text-primary); margin: 28px 0 12px;
    padding-bottom: 8px; border-bottom: 2px solid var(--border);
  }
  .prose-notes h3 { font-size: 14px; font-weight: 700; color: var(--primary); margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.06em; }
  .prose-notes p { margin: 0 0 14px; }
  .prose-notes hr { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
  .prose-notes strong { color: var(--text-primary); font-weight: 700; }
  .prose-notes li { margin-bottom: 6px; padding-left: 4px; }
  .prose-notes ul, .prose-notes ol { padding-left: 22px; margin: 10px 0 16px; }
  .prose-notes code {
    background: var(--primary-muted); color: var(--primary); padding: 2px 8px;
    border-radius: 6px; font-size: 13px; font-family: 'Courier New', monospace; font-weight: 600;
    border: 1px solid rgba(79, 70, 229, 0.15);
  }
  .prose-notes blockquote {
    border-left: 3px solid var(--primary);
    background: var(--primary-muted);
    padding: 14px 18px;
    border-radius: 0 var(--r-md) var(--r-md) 0;
    margin: 20px 0;
    color: var(--text-secondary);
    font-style: italic;
  }

  /* ===== WEAK TOPICS ===== */
  .weak-topic-bar-track {
    height: 5px;
    background: rgba(0,0,0,0.07);
    border-radius: var(--r-full);
    overflow: hidden;
    margin-top: 6px;
  }

  /* ===== ANIMATIONS ===== */
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes cvFloat {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-4px) scale(1.02); }
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
  @keyframes globalBackgroundGradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes orbPulse1 {
    0% { transform: scale(1) translate(0, 0); opacity: 0.3; }
    100% { transform: scale(1.3) translate(5vw, 5vh); opacity: 0.5; }
  }
  @keyframes orbPulse2 {
    0% { transform: scale(1) translate(0, 0); opacity: 0.2; }
    100% { transform: scale(1.4) translate(-5vw, -5vh); opacity: 0.4; }
  }
  @keyframes cvFadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 768px) {
    .main-content { padding: var(--sp-md) var(--sp-md) calc(88px + env(safe-area-inset-bottom)); }
    .dash-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  }
  @media (max-width: 480px) {
    .main-content { padding: var(--sp-sm) var(--sp-sm) calc(88px + env(safe-area-inset-bottom)); }
    .dash-grid { gap: 10px; }
  }
  @media (min-width: 769px) {
    .main-content { padding: var(--sp-xl) var(--sp-xl) var(--sp-xl); max-width: 900px; }
    .dash-grid { grid-template-columns: repeat(4, 1fr); }
    .subj-ch-grid { grid-template-columns: 1fr 1fr; }
    .chapter-hub-grid { grid-template-columns: 1fr 1fr; }
    .nav-bar { height: 70px; }
  }

  /* floating forum safe area */
  @supports (bottom: env(safe-area-inset-bottom)) {
    .floating-forum-btn {
      bottom: calc(80px + env(safe-area-inset-bottom));
    }
  }
`;

export const authStyles = `
  /* Kept for backward compatibility */
`;
