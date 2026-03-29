import dotenv from 'dotenv';
import path from 'path';

dotenv.config({path: path.resolve(process.cwd(), '.env.local')});
fetch('https://api.groq.com/openai/v1/models', {
  headers: { 'Authorization': `Bearer ${process.env.VITE_GROQ_KEY}` }
})
.then(res => res.json())
.then(data => {
  if (data.data) {
    console.log("AVAILABLE MODELS:\n" + data.data.map(m => m.id).join("\n"));
  } else {
    console.log("ERROR:", data);
  }
});
