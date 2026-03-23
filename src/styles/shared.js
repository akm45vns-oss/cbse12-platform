export const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; min-height: 100vh; background: #fff0f5; }
  button { cursor: pointer; font-family: inherit; }
  .card { background: white; border-radius: 16px; border: 1px solid #fce7f3; padding: 20px; transition: box-shadow 0.2s, transform 0.2s; }
  .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
  .opt-btn { width: 100%; text-align: left; padding: 14px 18px; border-radius: 12px; border: 2px solid #fce7f3; background: white; color: #1e293b; font-size: 14px; line-height: 1.5; transition: all 0.15s; }
  .opt-btn:hover { border-color: #f472b4; background: #fff0f5; }
  .opt-selected { border-color: #ec4899 !important; background: #fdf2f8 !important; color: #be185d !important; font-weight: 600; }
  .opt-correct { border-color: #16a34a !important; background: #f0fdf4 !important; color: #15803d !important; }
  .opt-wrong { border-color: #dc2626 !important; background: #fef2f2 !important; color: #dc2626 !important; }
  .qnum { width: 32px; height: 32px; border-radius: 8px; border: none; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.1s; touch-action: manipulation; }
  .qnum:hover { transform: scale(1.1); }
  @media (max-width: 480px) { .qnum { width: 36px; height: 36px; font-size: 12px; } }
  
  /* Layout */
  .main-content { max-width: 1100px; margin: 0 auto; padding: 24px 16px; }
  .dash-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 16px; }
  .subj-ch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 10px; }
  .chapter-hub-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap: 14px; }
  .prog-summary-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(180px,1fr)); gap: 14px; margin-bottom: 28px; }
  .prog-ch-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); gap: 6px; }
  .nav-bar { max-width: 1100px; margin: 0 auto; padding: 0 16px; height: 60px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .nav-username { display: block; }
  .dash-overall { background: linear-gradient(135deg, #831843 0%, #9d174d 100%); border-radius: 20px; padding: 24px; margin-bottom: 24px; color: white; display: flex; flex-wrap: wrap; gap: 20px; align-items: center; justify-content: space-between; }
  .dash-overall-stats { display: flex; gap: 16px; flex-wrap: wrap; }
  .notes-content-pad { padding: 40px 48px; }
  
  @media (max-width: 768px) {
    .main-content { padding: 16px 12px; }
    .dash-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
    .subj-ch-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .chapter-hub-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
    .prog-summary-grid { grid-template-columns: 1fr 1fr; }
    .prog-ch-grid { grid-template-columns: 1fr; }
    .nav-username { display: none; }
    .dash-overall { flex-direction: column; align-items: flex-start; gap: 14px; padding: 18px; }
    .dash-overall-stats { gap: 10px; }
    .notes-content-pad { padding: 20px 18px; }
  }
  @media (max-width: 480px) {
    .main-content { padding: 12px 10px; }
    .dash-grid { grid-template-columns: 1fr; }
    .subj-ch-grid { grid-template-columns: 1fr; }
    .chapter-hub-grid { grid-template-columns: 1fr; }
    .prog-summary-grid { grid-template-columns: 1fr 1fr; }
    .dash-overall-stats { width: 100%; justify-content: space-between; }
    .notes-content-pad { padding: 16px 14px; }
    .opt-btn { padding: 11px 14px; font-size: 13px; }
  }
  
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
    .breadcrumb-chapter { display: inline !important; }
  }
  
  .prose-notes { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.85; color: #2d1832; font-size: 15px; }
  .prose-notes-block { background: linear-gradient(135deg, #fff8fb 0%, #fff0f5 100%); border-radius: 18px; border: 1px solid #fce7f3; padding: 40px 48px; box-shadow: 0 4px 32px rgba(236,72,153,0.07), 0 1px 4px rgba(0,0,0,0.04); overflow-x: auto; }
  .prose-notes h1 { font-family: 'Georgia', serif; font-size: 26px; font-weight: 900; color: #831843; margin: 0 0 4px; letter-spacing: -0.02em; line-height: 1.2; }
  .prose-notes h2 { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 15px; font-weight: 800; color: #be185d; margin: 32px 0 12px; padding: 10px 16px; background: linear-gradient(90deg, #fce7f3, #fff0f5); border-left: 4px solid #ec4899; border-radius: 0 10px 10px 0; text-transform: uppercase; letter-spacing: 0.06em; }
  .prose-notes h3 { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 14px; font-weight: 700; color: #9d174d; margin: 20px 0 6px; }
  .prose-notes p { margin: 0 0 12px; }
  .prose-notes hr { border: none; border-top: 2px dashed #fce7f3; margin: 20px 0; }
  .prose-notes strong { color: #831843; font-weight: 700; }
  .prose-notes li { margin-bottom: 6px; padding-left: 4px; }
  .prose-notes ul, .prose-notes ol { padding-left: 22px; margin: 8px 0 14px; }
  .prose-notes code { background: #fdf2f8; color: #be185d; padding: 1px 6px; border-radius: 5px; font-size: 13px; font-family: 'Courier New', monospace; }
  .prose-notes blockquote { border-left: 4px solid #f9a8d4; background: #fff0f5; padding: 10px 16px; border-radius: 0 10px 10px 0; margin: 14px 0; color: #9d174d; font-style: italic; }
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #fff0f5; }
  ::-webkit-scrollbar-thumb { background: #f9a8d4; border-radius: 3px; }
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
