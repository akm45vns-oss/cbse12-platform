export const globalStyles = `
  /* ===== MIDNIGHT AURORA GLASSMORPHISM VARIABLES ===== */
  :root {
    --bg-primary: #0f172a;
    --bg-secondary: rgba(15, 23, 42, 0.4);
    --bg-tertiary: rgba(255, 255, 255, 0.05);
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-tertiary: #94a3b8;
    --border-color: rgba(255, 255, 255, 0.08);
    --card-shadow: rgba(0, 0, 0, 0.4);
    --accent: #06b6d4;
    --accent-dark: #3b82f6;
    --accent-light: #22d3ee;
    
    /* Responsive Typography Scale */
    --fs-h1: 32px; --fs-h2: 24px; --fs-h3: 18px;
    --fs-body: 15px; --fs-sm: 13px;
    
    /* Responsive Spacing */
    --spacing-xs: 8px; --spacing-sm: 12px; --spacing-md: 16px;
    --spacing-lg: 24px; --spacing-xl: 32px; --spacing-2xl: 48px;
    
    /* Border Radius */
    --radius-sm: 8px; --radius-md: 12px;
    --radius-lg: 18px; --radius-xl: 24px;
  }

  /* ===== GLOBAL RESET & BASE ===== */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  
  html, body, #root { 
    width: 100%; 
    min-height: 100vh; 
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-weight: 400; -webkit-font-smoothing: antialiased; }
  button { cursor: pointer; font-family: inherit; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  
  /* ===== CARDS & CONTAINERS ===== */
  .card { 
    background: var(--bg-secondary); 
    border-radius: var(--radius-lg); 
    border: 1px solid var(--border-color); 
    padding: 20px; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    box-shadow: 0 24px 64px var(--card-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }

  .card:hover { 
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: translateY(-4px);
    border-color: rgba(6, 182, 212, 0.3);
  }

  .hover-lift:hover { 
    transform: translateY(-6px); 
    box-shadow: 0 16px 40px rgba(6, 182, 212, 0.2); 
    border-color: rgba(6, 182, 212, 0.4);
  }
  
  /* ===== BUTTONS ===== */
  .opt-btn {
    width: 100%; text-align: left; padding: 16px 20px; border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: #f8fafc; font-size: 14px; font-weight: 500; line-height: 1.6;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); min-height: 48px; word-wrap: break-word;
  }
  .opt-btn:hover { 
    border-color: rgba(6, 182, 212, 0.5); 
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 16px rgba(6, 182, 212, 0.15);
  }
  .opt-selected { 
    border-color: #06b6d4 !important; 
    background: rgba(6, 182, 212, 0.15) !important; 
    color: #22d3ee !important; 
    font-weight: 600;
    box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.3) !important;
  }
  .opt-correct { 
    border-color: #10b981 !important; 
    background: rgba(16, 185, 129, 0.15) !important; 
    color: #34d399 !important;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3) !important;
  }
  .opt-wrong { 
    border-color: #ef4444 !important; 
    background: rgba(239, 68, 68, 0.15) !important; 
    color: #f87171 !important;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3) !important;
  }
  
  /* ===== QUESTION NUMBERS ===== */
  .qnum { 
    width: 40px; height: 40px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1); 
    font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.05); color: #cbd5e1;
  }
  .qnum:hover { 
    transform: scale(1.15) translateY(-2px);
    background: rgba(255, 255, 255, 0.1); border-color: #06b6d4; color: white;
  }
  .qnum-active { background: rgba(6, 182, 212, 0.2); border-color: #06b6d4; color: #22d3ee; }
  @media (max-width: 480px) { .qnum { width: 38px; height: 38px; font-size: 11px; } }
  
  /* ===== LAYOUTS ===== */
  .main-content { max-width: 1140px; margin: 0 auto; padding: 40px 24px; position: relative; z-index: 10; }
  .dash-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 24px; }
  .subj-ch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 16px; }
  .chapter-hub-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap: 16px; }
  .prog-summary-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(180px,1fr)); gap: 16px; margin-bottom: 32px; }
  .prog-ch-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); gap: 12px; }
  
  /* ===== NAVIGATION ===== */
  .nav-bar { 
    max-width: 1140px; margin: 0 auto; padding: 0 var(--spacing-xl); height: 76px; 
    display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-lg);
  }
  .nav-username { display: block; font-weight: 600; color: #f8fafc; font-size: var(--fs-sm); }
  .nav-brand { font-size: 20px !important; }
  .nav-btn-text { display: inline; font-size: var(--fs-sm); }
  
  /* ===== DASHBOARD ===== */
  .dash-overall { 
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(28px);
    border-radius: 28px; padding: 40px; margin-bottom: 40px; 
    color: white; display: flex; flex-wrap: wrap; gap: 32px; 
    align-items: center; justify-content: space-between;
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.08);
    position: relative; overflow: hidden;
  }
  .dash-overall-stats { display: flex; gap: 24px; flex-wrap: wrap; position: relative; z-index: 2; }
  
  /* ===== CONTENT PADDING ===== */
  .notes-content-pad { padding: 48px 56px; }
  
  /* ===== RESPONSIVE ===== */
  @media (max-width: 1023px) {
    .dash-grid { grid-template-columns: repeat(2, 1fr); }
    .dash-overall { flex-direction: column; align-items: flex-start; padding: 32px; }
    .nav-bar { height: 64px; padding: 0 20px; }
  }
  @media (max-width: 767px) {
    .main-content { padding: 24px 16px; }
    .dash-grid { grid-template-columns: 1fr; }
    .nav-bar { height: 60px; padding: 0 16px; }
    .nav-btn-text, .nav-username { display: none !important; }
    .dash-overall { padding: 24px; }
    .notes-content-pad { padding: 24px 16px; }
  }
  
  /* ===== PROSE & NOTES (Dark Theme) ===== */
  .prose-notes { line-height: 1.8; color: #cbd5e1; font-size: 15px; font-weight: 400; }
  .prose-notes-block { 
    background: rgba(15, 23, 42, 0.5); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); 
    padding: 48px 56px; box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4); backdrop-filter: blur(30px); color: #f8fafc;
  }
  .prose-notes h1 { font-size: 32px; font-weight: 900; color: #f8fafc; margin: 0 0 12px; letter-spacing: -0.02em; line-height: 1.1; }
  .prose-notes h2 { font-size: 16px; font-weight: 800; color: #22d3ee; margin: 32px 0 16px; padding: 12px 18px; background: rgba(6, 182, 212, 0.1); border-left: 4px solid #06b6d4; border-radius: 0 12px 12px 0; text-transform: uppercase; letter-spacing: 0.08em; }
  .prose-notes h3 { font-size: 14px; font-weight: 700; color: #3b82f6; margin: 24px 0 8px; text-transform: uppercase; }
  .prose-notes p { margin: 0 0 16px; }
  .prose-notes hr { border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 32px 0; }
  .prose-notes strong { color: #f8fafc; font-weight: 700; }
  .prose-notes li { margin-bottom: 8px; padding-left: 4px; }
  .prose-notes ul, .prose-notes ol { padding-left: 24px; margin: 12px 0 20px; }
  .prose-notes code { background: rgba(255, 255, 255, 0.1); color: #22d3ee; padding: 2px 8px; border-radius: 6px; font-size: 13px; font-family: 'Courier New', monospace; font-weight: 600; border: 1px solid rgba(255, 255, 255, 0.1); }
  .prose-notes blockquote { border-left: 4px solid #818cf8; background: rgba(129, 140, 248, 0.1); padding: 16px 20px; border-radius: 0 12px 12px 0; margin: 24px 0; color: #cbd5e1; font-style: italic; border: 1px solid rgba(129, 140, 248, 0.2); border-left: 4px solid #818cf8; }
  
  /* ===== SCROLLBARS ===== */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
`;

export const authStyles = `
  /* Kept for backward compatibility if ever toggled, but AuthView manages its own styling */
`;
