export const globalStyles = `
  /* ===== GLOBAL RESET & BASE ===== */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  html, body, #root { width: 100%; min-height: 100vh; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fff0f5 100%); }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; -webkit-font-smoothing: antialiased; }
  button { cursor: pointer; font-family: inherit; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  
  /* ===== CARDS & CONTAINERS ===== */
  .card { 
    background: rgba(255, 255, 255, 0.95); 
    border-radius: 18px; 
    border: 1.5px solid #fce7f3; 
    padding: 20px; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(236, 72, 153, 0.08);
  }
  .card:hover { 
    box-shadow: 0 12px 36px rgba(236, 72, 153, 0.15);
    transform: translateY(-4px);
    border-color: #f472b4;
  }
  .hover-lift:hover { 
    transform: translateY(-6px); 
    box-shadow: 0 16px 40px rgba(236, 72, 153, 0.2); 
  }
  
  /* ===== BUTTONS ===== */
  .opt-btn { 
    width: 100%; 
    text-align: left; 
    padding: 14px 18px; 
    border-radius: 14px; 
    border: 2px solid #fce7f3; 
    background: white; 
    color: #1e293b; 
    font-size: 14px; 
    font-weight: 500;
    line-height: 1.5; 
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .opt-btn:hover { 
    border-color: #f472b4; 
    background: linear-gradient(135deg, #fff8fb, #fff0f5);
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.1);
  }
  .opt-selected { 
    border-color: #ec4899 !important; 
    background: linear-gradient(135deg, #fdf2f8, #fff0f5) !important; 
    color: #be185d !important; 
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.2) !important;
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
    cursor: pointer; 
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(135deg, #fce7f3, #f9a8d4);
    color: #be185d;
    box-shadow: 0 2px 8px rgba(236, 72, 153, 0.15);
  }
  .qnum:hover { 
    transform: scale(1.15) translateY(-2px);
    box-shadow: 0 6px 16px rgba(236, 72, 153, 0.25);
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
    border-bottom: 1px solid rgba(236, 72, 153, 0.1);
    box-shadow: 0 4px 20px rgba(236, 72, 153, 0.05);
  }
  .nav-username { 
    display: block;
    font-weight: 600;
    color: #be185d;
  }
  
  /* ===== DASHBOARD ===== */
  .dash-overall { 
    background: linear-gradient(135deg, #be185d 0%, #ec4899 50%, #f472b4 100%);
    border-radius: 24px; 
    padding: 32px; 
    margin-bottom: 32px; 
    color: white; 
    display: flex; 
    flex-wrap: wrap; 
    gap: 28px; 
    align-items: center; 
    justify-content: space-between;
    box-shadow: 0 12px 40px rgba(236, 72, 153, 0.25);
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
    .opt-btn { 
      padding: 12px 14px; 
      font-size: 13px; 
    }
    .nav-bar {
      height: 60px;
      padding: 0 14px;
    }
  }
  
  /* ===== PRINT STYLES ===== */
  @media print {
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
    }
    .no-print {
      display: none !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
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
    border: 1.5px solid #fce7f3; 
    padding: 48px 56px; 
    box-shadow: 0 8px 32px rgba(236, 72, 153, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04);
    overflow-x: auto;
    backdrop-filter: blur(10px);
  }
  .prose-notes h1 { 
    font-size: 28px; 
    font-weight: 900; 
    color: #831843; 
    margin: 0 0 8px; 
    letter-spacing: -0.02em; 
    line-height: 1.1;
  }
  .prose-notes h2 { 
    font-size: 16px; 
    font-weight: 800; 
    color: #be185d; 
    margin: 32px 0 14px; 
    padding: 12px 18px; 
    background: linear-gradient(90deg, rgba(252, 231, 243, 0.8), rgba(255, 240, 245, 0.8));
    border-left: 4px solid #ec4899;
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
    border-top: 2px solid #fce7f3; 
    margin: 24px 0;
  }
  .prose-notes strong { 
    color: #831843; 
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
    background: linear-gradient(135deg, #fdf2f8, #fff0f5);
    color: #be185d; 
    padding: 2px 8px; 
    border-radius: 6px; 
    font-size: 13px; 
    font-family: 'Courier New', monospace;
    font-weight: 500;
    border: 1px solid #fce7f3;
  }
  .prose-notes blockquote { 
    border-left: 4px solid #f9a8d4; 
    background: linear-gradient(135deg, #fff0f5, #fff8fb);
    padding: 12px 18px; 
    border-radius: 0 12px 12px 0; 
    margin: 16px 0; 
    color: #9d174d; 
    font-style: italic;
    border: 1px solid #fce7f3;
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
    background: linear-gradient(180deg, #f472b4, #ec4899);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #ec4899, #db2777);
  }
`;


export const authStyles = `
  .auth-input { width: 100%; padding: 11px 14px; border: 1.5px solid #fbcfe8; border-radius: 10px; background: #fff0f5; color: #831843; font-size: 14px; outline: none; transition: border-color 0.2s; }
  .auth-input:focus { border-color: #ec4899; }
  .auth-input::placeholder { color: #f9a8d4; }
  .auth-btn { width: 100%; padding: 12px; border: none; border-radius: 10px; background: linear-gradient(135deg, #ec4899, #db2777); color: white; font-size: 15px; font-weight: 700; letter-spacing: 0.02em; transition: opacity 0.2s, transform 0.1s; }
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
