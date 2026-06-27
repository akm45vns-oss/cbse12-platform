export function validateQuestion(qObj) {
  if (!qObj) return null;
  const q = qObj.q || qObj.question || qObj.text;
  if (!q) return null;
  
  let opts = qObj.opts || qObj.options || [];
  if (!Array.isArray(opts)) opts = [opts];
  while (opts.length < 4) { opts.push(`Option ${opts.length + 1}`); }
  
  let ans = qObj.ans;
  if (typeof ans !== 'number') {
    if (typeof qObj.answer === 'number') ans = qObj.answer;
    else if (typeof qObj.correctAnswer === 'number') ans = qObj.correctAnswer;
    else ans = 0;
  }
  
  return { 
    q, 
    opts: opts.slice(0, 4), 
    ans: (ans >= 0 && ans < 4) ? ans : 0, 
    exp: qObj.exp || qObj.explanation || "No explanation available" 
  };
}
