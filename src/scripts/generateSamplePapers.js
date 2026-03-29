/**
 * CBSE Sample Papers Generator
 * Generates 5 unique sample papers per subject matching CBSE format & weightage
 * Stores in 'sample_papers' table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { CURRICULUM } from '../constants/curriculum.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const groqKey = process.env.VITE_GROQ_KEY;

if (!supabaseUrl || !supabaseKey || !groqKey) {
  console.error("❌ Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CBSE Subject configuration
const SUBJECTS_CONFIG = {
  Physics: {
    totalMarks: 70,
    sections: [
      { name: "Section A", questions: 5, marksEach: 1, type: "MCQ" },
      { name: "Section B", questions: 5, marksEach: 2, type: "Short Answer" },
      { name: "Section C", questions: 4, marksEach: 3, type: "Short Answer" },
      { name: "Section D", questions: 4, marksEach: 5, type: "Long Answer" }
    ]
  },
  Chemistry: {
    totalMarks: 70,
    sections: [
      { name: "Section A", questions: 5, marksEach: 1, type: "MCQ" },
      { name: "Section B", questions: 5, marksEach: 2, type: "Short Answer" },
      { name: "Section C", questions: 4, marksEach: 3, type: "Short Answer" },
      { name: "Section D", questions: 4, marksEach: 5, type: "Long Answer" }
    ]
  },
  Biology: {
    totalMarks: 70,
    sections: [
      { name: "Section A", questions: 5, marksEach: 1, type: "MCQ" },
      { name: "Section B", questions: 5, marksEach: 2, type: "Short Answer" },
      { name: "Section C", questions: 4, marksEach: 3, type: "Short Answer" },
      { name: "Section D", questions: 4, marksEach: 5, type: "Long Answer" }
    ]
  },
  English: {
    totalMarks: 80,
    sections: [
      { name: "Section A — Reading", questions: 3, marksEach: 10, type: "Reading Comprehension" },
      { name: "Section B — Writing", questions: 3, marksEach: 10, type: "Writing Skills" },
      { name: "Section C — Literature", questions: 4, marksEach: 10, type: "Text Books" }
    ]
  },
  Mathematics: {
    totalMarks: 80,
    sections: [
      { name: "Section A", questions: 20, marksEach: 1, type: "MCQ" },
      { name: "Section B", questions: 6, marksEach: 2, type: "Short Answer" },
      { name: "Section C", questions: 4, marksEach: 3, type: "Short Answer" },
      { name: "Section D", questions: 4, marksEach: 4, type: "Long Answer" }
    ]
  },
  "Computer Science": {
    totalMarks: 70,
    sections: [
      { name: "Section A", questions: 7, marksEach: 1, type: "MCQ" },
      { name: "Section B", questions: 5, marksEach: 2, type: "Short Answer" },
      { name: "Section C", questions: 4, marksEach: 3, type: "Programming/Problem Solving" },
      { name: "Section D", questions: 2, marksEach: 5, type: "Long Answer" }
    ]
  },
  Economics: {
    totalMarks: 80,
    sections: [
      { name: "Section A", questions: 10, marksEach: 1, type: "MCQ" },
      { name: "Section B", questions: 5, marksEach: 3, type: "Short Answer" },
      { name: "Section C", questions: 5, marksEach: 4, type: "Analysis Questions" },
      { name: "Section D", questions: 2, marksEach: 6, type: "Case Study/Descriptive" }
    ]
  },
  Accountancy: {
    totalMarks: 80,
    sections: [
      { name: "Section A", questions: 20, marksEach: 1, type: "MCQ" },
      { name: "Section B", questions: 5, marksEach: 3, type: "Short Answer" },
      { name: "Section C", questions: 4, marksEach: 8, type: "Numerical/Practical" },
      { name: "Section D", questions: 2, marksEach: 6, type: "Long Answer" }
    ]
  },
  "Business Studies": {
    totalMarks: 80,
    sections: [
      { name: "Section A", questions: 10, marksEach: 1, type: "MCQ" },
      { name: "Section B", questions: 5, marksEach: 3, type: "Short Answer" },
      { name: "Section C", questions: 4, marksEach: 4, type: "Case Study" },
      { name: "Section D", questions: 2, marksEach: 7, type: "Descriptive" }
    ]
  },
  History: {
    totalMarks: 80,
    sections: [
      { name: "Section A", questions: 10, marksEach: 1, type: "MCQ" },
      { name: "Section B", questions: 8, marksEach: 2, type: "Very Short Answer" },
      { name: "Section C", questions: 6, marksEach: 4, type: "Short Answer" },
      { name: "Section D", questions: 2, marksEach: 8, type: "Long Answer" }
    ]
  },
  "Political Science": {
    totalMarks: 80,
    sections: [
      { name: "Section A", questions: 10, marksEach: 1, type: "MCQ" },
      { name: "Section B", questions: 8, marksEach: 2, type: "Very Short Answer" },
      { name: "Section C", questions: 6, marksEach: 4, type: "Short Answer" },
      { name: "Section D", questions: 2, marksEach: 8, type: "Long Answer" }
    ]
  },
  "Physical Education": {
    totalMarks: 70,
    sections: [
      { name: "Section A", questions: 20, marksEach: 1, type: "MCQ" },
      { name: "Section B", questions: 5, marksEach: 2, type: "Short Answer" },
      { name: "Section C", questions: 3, marksEach: 4, type: "Analysis Questions" },
      { name: "Section D", questions: 2, marksEach: 5, type: "Descriptive" }
    ]
  }
};

// Generate paper content using Groq API
async function generatePaperContent(subject, setNumber, config) {
  const sectionsDescr = config.sections
    .map(s => `- **${s.name}** (${s.questions} questions × ${s.marksEach} marks = ${s.questions * s.marksEach} marks) [${s.type}]`)
    .join('\n');

  const prompt = `Generate a CBSE Class 12 Sample Question Paper Set ${setNumber} for ${subject}.

**Paper Details:**
- Total Marks: ${config.totalMarks}
- Time: 3 Hours
- Format: Strictly follow CBSE guidelines

**Section Structure:**
${sectionsDescr}

**Requirements:**
1. Create ORIGINAL, unique questions (NOT from previous papers or textbooks)
2. Match curriculum difficulty level
3. Follow CBSE exam format exactly
4. Include all sections with correct marks distribution
5. Mix of conceptual, numerical, and application-based questions
6. Clear marking scheme indication

Format as a professional exam paper with:
- CBSE Header
- Instructions for students
- All sections clearly marked
- Question numbers properly formatted
- Marking values clearly shown
- Space for answers (indicated as "Answer:" or similar)

Paper Set Number: ${setNumber}
Subject: ${subject}
Uniqueness: This is SET ${setNumber}/5 - completely different from other sets`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 4000,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const error = await res.text();
      if (res.status === 429) throw new Error(`Rate limit (429)`);
      throw new Error(`Groq API ${res.status}: ${error.substring(0, 100)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    throw err;
  }
}

// Save paper to database
async function savePaperToDB(subject, setNumber, content) {
  try {
    const { error } = await supabase.from('sample_papers').insert({
      subject,
      set_number: setNumber,
      content,
      total_marks: SUBJECTS_CONFIG[subject].totalMarks,
      created_at: new Date().toISOString()
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`❌ DB error: ${err.message}`);
    return false;
  }
}

// Main generation function
async function generateAllPapers() {
  console.log(`\n${'═'.repeat(80)}`);
  console.log('🚀 CBSE SAMPLE PAPERS GENERATOR - 5 SETS PER SUBJECT');
  console.log(`${'═'.repeat(80)}\n`);

  const subjects = Object.keys(SUBJECTS_CONFIG);
  console.log(`📚 Subjects to process: ${subjects.length}`);
  console.log(`📄 Papers to generate: ${subjects.length * 5}\n`);

  let totalSuccess = 0;
  let totalFailed = 0;
  const failedPapers = [];

  for (const subject of subjects) {
    const config = SUBJECTS_CONFIG[subject];
    console.log(`\n📖 ${subject} (${config.totalMarks} marks)`);
    console.log('─'.repeat(60));

    for (let setNum = 1; setNum <= 5; setNum++) {
      let retries = 0;
      let generated = false;

      while (retries < 3 && !generated) {
        try {
          process.stdout.write(`   Set ${setNum}/5... `);

          const content = await generatePaperContent(subject, setNum, config);
          const saved = await savePaperToDB(subject, setNum, content);

          if (saved) {
            console.log(`✅`);
            totalSuccess++;
            generated = true;
          } else {
            console.log(`❌ DB error`);
            totalFailed++;
            failedPapers.push({ subject, setNumber: setNum });
            generated = true;
          }
        } catch (err) {
          if (err.message.includes('429')) {
            console.log(`⏳ Rate limited`);
            const waitTime = (retries + 1) * 60000;
            await new Promise(r => setTimeout(r, waitTime));
            retries++;
          } else {
            console.log(`❌ ${err.message}`);
            totalFailed++;
            failedPapers.push({ subject, setNumber: setNum });
            generated = true;
          }
        }
      }

      // Rate limiting between papers
      if (setNum < 5) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(80)}`);
  console.log('📊 GENERATION COMPLETE');
  console.log(`${'═'.repeat(80)}`);
  console.log(`✅ Success: ${totalSuccess}/${subjects.length * 5}`);
  console.log(`❌ Failed:  ${totalFailed}/${subjects.length * 5}`);

  if (failedPapers.length > 0) {
    console.log(`\n⚠️  Failed Papers:`);
    failedPapers.forEach(({ subject, setNumber }) => {
      console.log(`   - ${subject}: Set ${setNumber}`);
    });
  }

  console.log(`\n${'═'.repeat(80)}\n`);
}

// Run
generateAllPapers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
