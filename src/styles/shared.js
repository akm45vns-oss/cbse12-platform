export const globalStyles = `
  /* ===== PROFESSIONAL COLOR VARIABLES ===== */
  :root {
    --bg-primary: #f8fafc;
    --bg-secondary: #ffffff;
    --bg-tertiary: #f1f5f9;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-tertiary: #94a3b8;
    --border-color: #e2e8f0;
    --card-shadow: rgba(8, 145, 178, 0.08);
    --accent: #0891b2;
    --accent-dark: #0d9488;
    --accent-light: #06b6d4;
  }

  html.dark-mode {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-tertiary: #94a3b8;
    --border-color: #475569;
    --card-shadow: rgba(6, 182, 212, 0.15);
    --accent: #06b6d4;
    --accent-dark: #14b8a6;
    --accent-light: #22d3ee;
  }

  /* ===== GLOBAL RESET & BASE ===== */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  html, body, #root { 
    width: 100%; 
    min-height: 100vh; 
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: background-color 0.3s, color 0.3s;
  }

  html.dark-mode, html.dark-mode body, html.dark-mode #root {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d1117 100%);
  }

  html, body, #root {
    background: linear-gradient(135deg, #f0f4f8 0%, #f8fafc 50%, #ffffff 100%);
  }

  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-weight: 400; -webkit-font-smoothing: antialiased; }
  button { cursor: pointer; font-family: inherit; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  
  /* ===== CARDS & CONTAINERS ===== */
  .card { 
    background: rgba(255, 255, 255, 0.95); 
    border-radius: 18px; 
    border: 1.5px solid var(--border-color); 
    padding: 20px; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px var(--card-shadow);
    color: var(--text-primary);
  }

  html.dark-mode .card {
    background: rgba(30, 41, 59, 0.95);
    border: 1.5px solid #334155;
  }

  .card:hover { 
    box-shadow: 0 12px 36px rgba(8, 145, 178, 0.15);
    transform: translateY(-4px);
    border-color: #06b6d4;
  }

  html.dark-mode .card:hover {
    box-shadow: 0 12px 36px rgba(6, 182, 212, 0.2);
  }

  .hover-lift:hover { 
    transform: translateY(-6px); 
    box-shadow: 0 16px 40px rgba(8, 145, 178, 0.2); 
  }
  
  /* ===== BUTTONS ===== */
  .opt-btn { 
    width: 100%; 
    text-align: left; 
    padding: 14px 18px; 
    border-radius: 14px; 
    border: 2px solid #e2e8f0; 
    background: white; 
    color: #1e293b; 
    font-size: 14px; 
    font-weight: 500;
    line-height: 1.5; 
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .opt-btn:hover { 
    border-color: #06b6d4; 
    background: linear-gradient(135deg, #f0f9fc, #e0f7fa);
    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.1);
  }
  .opt-selected { 
    border-color: #0891b2 !important; 
    background: linear-gradient(135deg, #e0f7fa, #b3e5fc) !important; 
    color: #00546d !important; 
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.2) !important;
  }
  .opt-correct { 
    border-color: #16a34a !important; 
    background: linear-gradient(135deg, #f7fee7, #f0fdf4) !important; 
    color: #15803d !important;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.1) !important;
  }
  .opt-wrong { 
    border-color: #dc2626 !important; 
    background: linear-gradient(135deg, #fef5f5, #fef2f2) !important; 
    color: #991b1b !important;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1) !important;
  }
  
  /* ===== QUESTION NUMBERS ===== */
  .qnum { 
    width: 40px; 
    height: 40px; 
    border-radius: 10px; 
    border: none; 
    font-size: 12px; 
    font-weight: 700; 
    font-family: 'Poppins', sans-serif;
    cursor: pointer; 
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #0369a1;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  }
  .qnum:hover { 
    transform: scale(1.15) translateY(-2px);
    box-shadow: 0 6px 16px rgba(8, 145, 178, 0.25);
  }
  .qnum:active { 
    transform: scale(0.95);
  }
  @media (max-width: 480px) { 
    .qnum { 
      width: 38px; 
      height: 38px; 
      font-size: 11px; 
    } 
  }
  
  /* ===== LAYOUTS ===== */
  .main-content { 
    max-width: 1100px; 
    margin: 0 auto; 
    padding: 32px 20px; 
  }
  .dash-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); 
    gap: 20px; 
  }
  .subj-ch-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); 
    gap: 12px; 
  }
  .chapter-hub-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); 
    gap: 16px; 
  }
  .prog-summary-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill,minmax(180px,1fr)); 
    gap: 16px; 
    margin-bottom: 32px; 
  }
  .prog-ch-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); 
    gap: 8px; 
  }
  
  /* ===== NAVIGATION ===== */
  .nav-bar { 
    max-width: 1100px; 
    margin: 0 auto; 
    padding: 0 20px; 
    height: 70px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    gap: 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(8, 145, 178, 0.1);
    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.05);
  }
  .nav-username { 
    display: block;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    color: #0891b2;
  }
  
  /* ===== DASHBOARD ===== */
  .dash-overall { 
    background: linear-gradient(135deg, #0369a1 0%, #0891b2 50%, #06b6d4 100%);
    border-radius: 24px; 
    padding: 32px; 
    margin-bottom: 32px; 
    color: white; 
    display: flex; 
    flex-wrap: wrap; 
    gap: 28px; 
    align-items: center; 
    justify-content: space-between;
    box-shadow: 0 12px 40px rgba(8, 145, 178, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .dash-overall-stats { 
    display: flex; 
    gap: 24px; 
    flex-wrap: wrap; 
  }
  
  /* ===== CONTENT PADDING ===== */
  .notes-content-pad { 
    padding: 48px 56px; 
  }
  
  /* ===== RESPONSIVE ===== */
  @media (max-width: 768px) {
    .main-content { 
      padding: 20px 16px; 
    }
    .dash-grid { 
      grid-template-columns: 1fr 1fr; 
      gap: 14px; 
    }
    .subj-ch-grid { 
      grid-template-columns: 1fr 1fr; 
      gap: 10px; 
    }
    .chapter-hub-grid { 
      grid-template-columns: 1fr 1fr; 
      gap: 12px; 
    }
    .prog-summary-grid { 
      grid-template-columns: 1fr 1fr; 
    }
    .prog-ch-grid { 
      grid-template-columns: 1fr; 
    }
    .nav-username { 
      display: none; 
    }
    .dash-overall { 
      flex-direction: column; 
      align-items: flex-start; 
      gap: 16px; 
      padding: 24px; 
    }
    .dash-overall-stats { 
      gap: 12px; 
    }
    .notes-content-pad { 
      padding: 28px 24px; 
    }
    /* Touch-friendly buttons */
    button {
      min-height: 44px;
      min-width: 44px;
    }
    .opt-btn {
      min-height: 48px;
      padding: 14px 16px;
    }
  }
  
  @media (max-width: 480px) {
    .main-content { 
      padding: 16px 12px; 
    }
    .dash-grid { 
      grid-template-columns: 1fr; 
    }
    .subj-ch-grid { 
      grid-template-columns: 1fr; 
    }
    .chapter-hub-grid { 
      grid-template-columns: 1fr; 
    }
    .prog-summary-grid { 
      grid-template-columns: 1fr 1fr; 
    }
    .dash-overall-stats { 
      width: 100%; 
      justify-content: space-between; 
    }
    .notes-content-pad { 
      padding: 20px 16px; 
    }
    .notes-content-pad {
      padding: 20px 14px;
    }
    .opt-btn { 
      padding: 12px 14px; 
      font-size: 13px; 
      min-height: 48px;
    }
    .nav-bar {
      height: 60px;
      padding: 0 14px;
      gap: 8px;
    }
    /* Optimize inputs for mobile */
    input, textarea {
      min-height: 44px;
      padding: 12px 14px;
      font-size: 16px; /* Prevents zoom on iOS */
    }
    /* Better spacing for mobile buttons */
    button {
      min-height: 44px;
      padding: 12px 16px;
      font-size: 14px;
    }
    .qnum {
      min-height: 44px;
      min-width: 44px;
    }
    /* Better prose/content readability on mobile */
    .prose-notes {
      font-size: 15px;
      line-height: 1.7;
    }
    .prose-notes h1 {
      font-size: 22px;
    }
    .prose-notes h2 {
      font-size: 16px;
      padding: 10px 14px;
    }
    .prose-notes-block {
      padding: 20px 14px;
    }
    /* Better spacing for question navigator */
    .qnum {
      margin: 6px;
    }
  }
  
  /* ===== PRINT STYLES ===== */
  @media print {
    html, body, #root {
      background: white !important;
      color: #000 !important;
    }
    body * {
      visibility: hidden;
    }
    #printable-content, #printable-content * {
      visibility: visible;
    }
    #printable-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      margin: 0;
      padding: 20px;
      box-shadow: none !important;
      background: white !important;
      color: #000 !important;
    }
    .no-print, .no-print * {
      display: none !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background-image: none !important;
    }
    /* Print-specific typography */
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      page-break-inside: avoid;
    }
    p {
      page-break-inside: avoid;
      orphans: 2;
      widows: 2;
    }
    img {
      max-width: 100%;
      page-break-inside: avoid;
    }
    table {
      page-break-inside: avoid;
      border-collapse: collapse;
    }
    /* Optimize for print */
    @page {
      margin: 0.5in;
      size: A4;
    }
  }
  
  @media (min-width: 600px) {
    .breadcrumb-chapter { 
      display: inline !important; 
    }
  }
  
  /* ===== PROSE & NOTES ===== */
  .prose-notes { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.8; 
    color: #2d1832; 
    font-size: 15px; 
    font-weight: 400;
  }
  .prose-notes-block { 
    background: linear-gradient(135deg, rgba(255, 248, 251, 0.95) 0%, rgba(255, 240, 245, 0.95) 100%); 
    border-radius: 20px; 
    border: 1.5px solid #dbeafe; 
    padding: 48px 56px; 
    box-shadow: 0 8px 32px rgba(236, 72, 153, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04);
    overflow-x: auto;
    backdrop-filter: blur(10px);
  }
  .prose-notes h1 { 
    font-size: 28px; 
    font-weight: 900; 
    color: #064e78; 
    margin: 0 0 8px; 
    letter-spacing: -0.02em; 
    line-height: 1.1;
  }
  .prose-notes h2 { 
    font-size: 16px; 
    font-weight: 800; 
    color: #0369a1; 
    margin: 32px 0 14px; 
    padding: 12px 18px; 
    background: linear-gradient(90deg, rgba(252, 231, 243, 0.8), rgba(255, 240, 245, 0.8));
    border-left: 4px solid #0891b2;
    border-radius: 0 12px 12px 0;
    text-transform: uppercase; 
    letter-spacing: 0.08em;
  }
  .prose-notes h3 { 
    font-size: 14px; 
    font-weight: 700; 
    color: #9d174d; 
    margin: 22px 0 8px; 
  }
  .prose-notes p { 
    margin: 0 0 14px; 
  }
  .prose-notes hr { 
    border: none; 
    border-top: 2px solid #dbeafe; 
    margin: 24px 0;
  }
  .prose-notes strong { 
    color: #064e78; 
    font-weight: 700; 
  }
  .prose-notes li { 
    margin-bottom: 8px; 
    padding-left: 4px; 
  }
  .prose-notes ul, .prose-notes ol { 
    padding-left: 24px; 
    margin: 10px 0 16px; 
  }
  .prose-notes code { 
    background: linear-gradient(135deg, #fdf2f8, #f0f9fc);
    color: #0369a1; 
    padding: 2px 8px; 
    border-radius: 6px; 
    font-size: 13px; 
    font-family: 'Courier New', monospace;
    font-weight: 500;
    border: 1px solid #dbeafe;
  }
  .prose-notes blockquote { 
    border-left: 4px solid #f9a8d4; 
    background: linear-gradient(135deg, #f0f9fc, #fff8fb);
    padding: 12px 18px; 
    border-radius: 0 12px 12px 0; 
    margin: 16px 0; 
    color: #9d174d; 
    font-style: italic;
    border: 1px solid #dbeafe;
    border-left: 4px solid #f9a8d4;
  }
  
  /* ===== SCROLLBARS ===== */
  ::-webkit-scrollbar { 
    width: 8px; 
    height: 8px;
  }
  ::-webkit-scrollbar-track { 
    background: rgba(252, 231, 243, 0.5); 
  }
  ::-webkit-scrollbar-thumb { 
    background: linear-gradient(180deg, #06b6d4, #0891b2);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #0891b2, #0284c7);
  }
`;


export const authStyles = `
  .auth-input { width: 100%; padding: 11px 14px; border: 1.5px solid #fbcfe8; border-radius: 10px; background: #f0f9fc; color: #064e78; font-size: 14px; outline: none; transition: border-color 0.2s; }
  .auth-input:focus { border-color: #0891b2; }
  .auth-input::placeholder { color: #f9a8d4; }
  .auth-btn { width: 100%; padding: 12px; border: none; border-radius: 10px; background: linear-gradient(135deg, #0891b2, #0284c7); color: white; font-size: 15px; font-weight: 700; letter-spacing: 0.02em; transition: opacity 0.2s, transform 0.1s; }
  .auth-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .auth-btn:active { transform: translateY(0); }
  .tab-btn { flex: 1; padding: 9px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; transition: all 0.2s; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes glow { 0%,100%{opacity:0.4} 50%{opacity:0.9} }
  .auth-wrap { display: flex; flex-direction: row; min-height: 100vh; }
  .auth-left { flex: 1; background: linear-gradient(140deg, #fce4ec 0%, #fdf2f8 55%, #fce4ec 100%); display: flex; flex-direction: column; justify-content: center; padding: 56px 60px; position: relative; overflow: hidden; min-width: 0; }
  .auth-right { width: 440px; flex-shrink: 0; background: #fce4ec; display: flex; flex-direction: column; justify-content: center; padding: 48px 40px; border-left: 1px solid #fbcfe8; overflow-y: auto; }
  .auth-title { font-size: 44px; }
  .auth-desc { display: block; }
  .auth-subjects { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 32px; max-width: 480px; }
  .auth-features { display: flex; flex-direction: column; gap: 10px; }
  @media (max-width: 860px) {
    .auth-wrap { flex-direction: column; }
    .auth-left { padding: 36px 24px 24px; justify-content: flex-start; }
    .auth-right { width: 100%; border-left: none; border-top: 1px solid #fbcfe8; padding: 28px 24px 40px; }
    .auth-title { font-size: 30px; }
    .auth-subjects { margin-bottom: 20px; }
    .auth-features { display: none; }
  }
  @media (max-width: 480px) {
    .auth-left { padding: 24px 16px 16px; }
    .auth-right { padding: 20px 16px 32px; }
    .auth-title { font-size: 24px; }
    .auth-subjects { grid-template-columns: 1fr 1fr; gap: 8px; max-width: 100%; }
  }
  input { font-family: inherit; }
`;
