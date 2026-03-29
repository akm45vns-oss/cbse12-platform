/**
 * seedAllChapters.js
 * Seeds ALL 182 chapters from the current curriculum.js via the edge function.
 * Run AFTER clearQuizSets.js (or after manually clearing the quiz_sets table).
 *
 * ⏱  Estimated runtime: ~182 chapters × 2 min delay = ~6 hours
 *    Run this script and leave it overnight.
 *
 * Usage:  node src/scripts/seedAllChapters.js
 * Resume: node src/scripts/seedAllChapters.js --resume
 *         (skips chapters already having ≥1 set in DB)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Edge function config (same anon token used by topUpTo5.js) ──────────────
const BASE_URL = 'https://winsxslcmlyxzmlctkzt.functions.supabase.co/seed-quiz-sets';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbnN4c2xjbWx5eHptbGN0a3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNTI2NzYsImV4cCI6MjA4OTgyODY3Nn0.3OQ9jOyJwAwaDUkrdUkAFfTX5H9Jxq5kasujiOaLRsM';
const DELAY_MS = 120_000; // 120 seconds — Groq API rate limit

// ── All 182 chapters from current curriculum.js ──────────────────────────────
const ALL_CHAPTERS = [
  // Physics (14)
  { subject: 'Physics', chapter: 'Electric Charges and Fields' },
  { subject: 'Physics', chapter: 'Electrostatic Potential and Capacitance' },
  { subject: 'Physics', chapter: 'Current Electricity' },
  { subject: 'Physics', chapter: 'Moving Charges and Magnetism' },
  { subject: 'Physics', chapter: 'Magnetism and Matter' },
  { subject: 'Physics', chapter: 'Electromagnetic Induction' },
  { subject: 'Physics', chapter: 'Alternating Current' },
  { subject: 'Physics', chapter: 'Electromagnetic Waves' },
  { subject: 'Physics', chapter: 'Ray Optics and Optical Instruments' },
  { subject: 'Physics', chapter: 'Wave Optics' },
  { subject: 'Physics', chapter: 'Dual Nature of Radiation and Matter' },
  { subject: 'Physics', chapter: 'Atoms' },
  { subject: 'Physics', chapter: 'Nuclei' },
  { subject: 'Physics', chapter: 'Semiconductor Electronics: Materials, Devices and Simple Circuits' },

  // Chemistry (16)
  { subject: 'Chemistry', chapter: 'The Solid State' },
  { subject: 'Chemistry', chapter: 'Solutions' },
  { subject: 'Chemistry', chapter: 'Electrochemistry' },
  { subject: 'Chemistry', chapter: 'Chemical Kinetics' },
  { subject: 'Chemistry', chapter: 'Surface Chemistry' },
  { subject: 'Chemistry', chapter: 'General Principles and Processes of Isolation of Elements' },
  { subject: 'Chemistry', chapter: 'The p-Block Elements (Groups 15–18)' },
  { subject: 'Chemistry', chapter: 'The d and f Block Elements' },
  { subject: 'Chemistry', chapter: 'Coordination Compounds' },
  { subject: 'Chemistry', chapter: 'Haloalkanes and Haloarenes' },
  { subject: 'Chemistry', chapter: 'Alcohols, Phenols and Ethers' },
  { subject: 'Chemistry', chapter: 'Aldehydes, Ketones and Carboxylic Acids' },
  { subject: 'Chemistry', chapter: 'Amines' },
  { subject: 'Chemistry', chapter: 'Biomolecules' },
  { subject: 'Chemistry', chapter: 'Polymers' },
  { subject: 'Chemistry', chapter: 'Chemistry in Everyday Life' },

  // Biology (16)
  { subject: 'Biology', chapter: 'Reproduction in Organisms' },
  { subject: 'Biology', chapter: 'Sexual Reproduction in Flowering Plants' },
  { subject: 'Biology', chapter: 'Human Reproduction' },
  { subject: 'Biology', chapter: 'Reproductive Health' },
  { subject: 'Biology', chapter: 'Principles of Inheritance and Variation' },
  { subject: 'Biology', chapter: 'Molecular Basis of Inheritance' },
  { subject: 'Biology', chapter: 'Evolution' },
  { subject: 'Biology', chapter: 'Human Health and Disease' },
  { subject: 'Biology', chapter: 'Strategies for Enhancement in Food Production' },
  { subject: 'Biology', chapter: 'Microbes in Human Welfare' },
  { subject: 'Biology', chapter: 'Biotechnology: Principles and Processes' },
  { subject: 'Biology', chapter: 'Biotechnology and its Applications' },
  { subject: 'Biology', chapter: 'Organisms and Populations' },
  { subject: 'Biology', chapter: 'Ecosystem' },
  { subject: 'Biology', chapter: 'Biodiversity and Conservation' },
  { subject: 'Biology', chapter: 'Environmental Issues' },

  // English (27)
  { subject: 'English', chapter: 'The Last Lesson' },
  { subject: 'English', chapter: 'Lost Spring' },
  { subject: 'English', chapter: 'Deep Water' },
  { subject: 'English', chapter: 'The Rattrap' },
  { subject: 'English', chapter: 'Indigo' },
  { subject: 'English', chapter: 'Poets and Pancakes' },
  { subject: 'English', chapter: 'The Interview' },
  { subject: 'English', chapter: 'Going Places' },
  { subject: 'English', chapter: 'My Mother at Sixty-Six' },
  { subject: 'English', chapter: 'An Elementary School Classroom in a Slum' },
  { subject: 'English', chapter: 'Keeping Quiet' },
  { subject: 'English', chapter: 'A Thing of Beauty' },
  { subject: 'English', chapter: 'A Roadside Stand' },
  { subject: 'English', chapter: "Aunt Jennifer's Tigers" },
  { subject: 'English', chapter: 'The Third Level' },
  { subject: 'English', chapter: 'The Tiger King' },
  { subject: 'English', chapter: 'Journey to the End of the Earth' },
  { subject: 'English', chapter: 'The Enemy' },
  { subject: 'English', chapter: 'Should Wizard Hit Mommy' },
  { subject: 'English', chapter: 'On the Face of It' },
  { subject: 'English', chapter: "Evans Tries an O-Level" },
  { subject: 'English', chapter: 'Memories of Childhood' },
  { subject: 'English', chapter: 'Notice Writing' },
  { subject: 'English', chapter: 'Formal Letter Writing' },
  { subject: 'English', chapter: 'Article Writing' },
  { subject: 'English', chapter: 'Report Writing' },
  { subject: 'English', chapter: 'Speech Writing' },

  // Mathematics (13)
  { subject: 'Mathematics', chapter: 'Relations and Functions' },
  { subject: 'Mathematics', chapter: 'Inverse Trigonometric Functions' },
  { subject: 'Mathematics', chapter: 'Matrices' },
  { subject: 'Mathematics', chapter: 'Determinants' },
  { subject: 'Mathematics', chapter: 'Continuity and Differentiability' },
  { subject: 'Mathematics', chapter: 'Application of Derivatives' },
  { subject: 'Mathematics', chapter: 'Integrals' },
  { subject: 'Mathematics', chapter: 'Application of Integrals' },
  { subject: 'Mathematics', chapter: 'Differential Equations' },
  { subject: 'Mathematics', chapter: 'Vector Algebra' },
  { subject: 'Mathematics', chapter: 'Three Dimensional Geometry' },
  { subject: 'Mathematics', chapter: 'Linear Programming' },
  { subject: 'Mathematics', chapter: 'Probability' },

  // Computer Science (17)
  { subject: 'Computer Science', chapter: 'Python Revision Tour' },
  { subject: 'Computer Science', chapter: 'Functions' },
  { subject: 'Computer Science', chapter: 'File Handling' },
  { subject: 'Computer Science', chapter: 'Exception Handling' },
  { subject: 'Computer Science', chapter: 'Stack' },
  { subject: 'Computer Science', chapter: 'Queue' },
  { subject: 'Computer Science', chapter: 'Linked List (Theory)' },
  { subject: 'Computer Science', chapter: 'Database Concepts' },
  { subject: 'Computer Science', chapter: 'Structured Query Language (SQL)' },
  { subject: 'Computer Science', chapter: 'MySQL Functions and Grouping' },
  { subject: 'Computer Science', chapter: 'Computer Networks' },
  { subject: 'Computer Science', chapter: 'Network Security Concepts' },
  { subject: 'Computer Science', chapter: 'Web Technologies Basics' },
  { subject: 'Computer Science', chapter: 'Cyber Safety' },
  { subject: 'Computer Science', chapter: 'Intellectual Property Rights' },
  { subject: 'Computer Science', chapter: 'IT Act and Cyber Crime' },
  { subject: 'Computer Science', chapter: 'E-waste Management' },

  // Economics (10)
  { subject: 'Economics', chapter: 'Introduction to Microeconomics' },
  { subject: 'Economics', chapter: 'Consumer Equilibrium and Demand' },
  { subject: 'Economics', chapter: 'Producer Behaviour and Supply' },
  { subject: 'Economics', chapter: 'Forms of Market and Price Determination' },
  { subject: 'Economics', chapter: 'Simple Applications of Tools of Demand and Supply' },
  { subject: 'Economics', chapter: 'National Income and Related Aggregates' },
  { subject: 'Economics', chapter: 'Money and Banking' },
  { subject: 'Economics', chapter: 'Determination of Income and Employment' },
  { subject: 'Economics', chapter: 'Government Budget and the Economy' },
  { subject: 'Economics', chapter: 'Balance of Payments and Foreign Exchange' },

  // Accountancy (11)
  { subject: 'Accountancy', chapter: 'Accounting for Not-for-Profit Organisations' },
  { subject: 'Accountancy', chapter: 'Accounting for Partnership: Basic Concepts' },
  { subject: 'Accountancy', chapter: 'Reconstitution of Partnership: Admission' },
  { subject: 'Accountancy', chapter: 'Reconstitution of Partnership: Retirement & Death' },
  { subject: 'Accountancy', chapter: 'Dissolution of Partnership Firm' },
  { subject: 'Accountancy', chapter: 'Accounting for Share Capital' },
  { subject: 'Accountancy', chapter: 'Issue and Redemption of Debentures' },
  { subject: 'Accountancy', chapter: 'Financial Statements of a Company' },
  { subject: 'Accountancy', chapter: 'Analysis of Financial Statements' },
  { subject: 'Accountancy', chapter: 'Accounting Ratios' },
  { subject: 'Accountancy', chapter: 'Cash Flow Statement' },

  // Business Studies (13)
  { subject: 'Business Studies', chapter: 'Nature and Significance of Management' },
  { subject: 'Business Studies', chapter: 'Principles of Management' },
  { subject: 'Business Studies', chapter: 'Business Environment' },
  { subject: 'Business Studies', chapter: 'Planning' },
  { subject: 'Business Studies', chapter: 'Organising' },
  { subject: 'Business Studies', chapter: 'Staffing' },
  { subject: 'Business Studies', chapter: 'Directing' },
  { subject: 'Business Studies', chapter: 'Controlling' },
  { subject: 'Business Studies', chapter: 'Financial Management' },
  { subject: 'Business Studies', chapter: 'Financial Markets' },
  { subject: 'Business Studies', chapter: 'Marketing Management' },
  { subject: 'Business Studies', chapter: 'Consumer Protection' },
  { subject: 'Business Studies', chapter: 'Entrepreneurship Development' },

  // History (15)
  { subject: 'History', chapter: 'Bricks, Beads and Bones: The Harappan Civilisation' },
  { subject: 'History', chapter: 'Kings, Farmers and Towns' },
  { subject: 'History', chapter: 'Kinship, Caste and Class' },
  { subject: 'History', chapter: 'Thinkers, Beliefs and Buildings' },
  { subject: 'History', chapter: 'Through the Eyes of Travellers' },
  { subject: 'History', chapter: 'Bhakti\u2013Sufi Traditions' },
  { subject: 'History', chapter: 'An Imperial Capital: Vijayanagara' },
  { subject: 'History', chapter: 'Peasants, Zamindars and the State' },
  { subject: 'History', chapter: 'Kings and Chronicles: The Mughal Courts' },
  { subject: 'History', chapter: 'Colonialism and the Countryside' },
  { subject: 'History', chapter: 'Rebels and the Raj: 1857 Revolt' },
  { subject: 'History', chapter: 'Colonial Cities' },
  { subject: 'History', chapter: 'Mahatma Gandhi and the Nationalist Movement' },
  { subject: 'History', chapter: 'Understanding Partition' },
  { subject: 'History', chapter: 'Framing the Constitution' },

  // Political Science (18)
  { subject: 'Political Science', chapter: 'The Cold War Era' },
  { subject: 'Political Science', chapter: 'The End of Bipolarity' },
  { subject: 'Political Science', chapter: 'US Hegemony in World Politics' },
  { subject: 'Political Science', chapter: 'Alternative Centres of Power' },
  { subject: 'Political Science', chapter: 'Contemporary South Asia' },
  { subject: 'Political Science', chapter: 'International Organisations' },
  { subject: 'Political Science', chapter: 'Security in the Contemporary World' },
  { subject: 'Political Science', chapter: 'Environment and Natural Resources' },
  { subject: 'Political Science', chapter: 'Globalisation' },
  { subject: 'Political Science', chapter: 'Challenges of Nation Building' },
  { subject: 'Political Science', chapter: 'Era of One-Party Dominance' },
  { subject: 'Political Science', chapter: 'Politics of Planned Development' },
  { subject: 'Political Science', chapter: "India's External Relations" },
  { subject: 'Political Science', chapter: 'Challenges to the Congress System' },
  { subject: 'Political Science', chapter: 'Crisis of the Constitutional Order' },
  { subject: 'Political Science', chapter: 'Rise of Popular Movements' },
  { subject: 'Political Science', chapter: 'Regional Aspirations' },
  { subject: 'Political Science', chapter: 'Recent Developments in Indian Politics' },

  // Physical Education (12)
  { subject: 'Physical Education', chapter: 'Management of Sporting Events' },
  { subject: 'Physical Education', chapter: 'Children and Women in Sports' },
  { subject: 'Physical Education', chapter: 'Yoga as Preventive Measure for Lifestyle Diseases' },
  { subject: 'Physical Education', chapter: 'Physical Education and Sports for CWSN' },
  { subject: 'Physical Education', chapter: 'Sports Nutrition' },
  { subject: 'Physical Education', chapter: 'Measurement and Evaluation in Sports' },
  { subject: 'Physical Education', chapter: 'Test and Measurement in Sports' },
  { subject: 'Physical Education', chapter: 'Biomechanics and Sports' },
  { subject: 'Physical Education', chapter: 'Psychology and Sports' },
  { subject: 'Physical Education', chapter: 'Training in Sports' },
  { subject: 'Physical Education', chapter: 'Doping \u2014 Drugs in Sports' },
  { subject: 'Physical Education', chapter: 'Sports Medicine' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function getExistingChapters() {
  let allRows = [], from = 0, to = 999, hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase.from('quiz_sets').select('subject, chapter').range(from, to);
    if (error) { console.error('Error reading DB:', error); return new Set(); }
    if (!data.length) { hasMore = false; break; }
    allRows.push(...data);
    from += 1000; to += 1000;
    if (data.length < 1000) hasMore = false;
  }
  return new Set(allRows.map(r => `${r.subject}|||${r.chapter}`));
}

async function seedChapter(subject, chapter) {
  const url = `${BASE_URL}?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`;
  const res = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${TOKEN}` } });
  const result = await res.json();
  return result;
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const isResume = process.argv.includes('--resume');
  const total = ALL_CHAPTERS.length;

  console.log(`\n🚀 CBSE 12 — Seeding ${total} chapters from current curriculum`);
  console.log(`   Mode: ${isResume ? 'RESUME (skip already-seeded chapters)' : 'FULL (seed all)'}`);
  console.log(`   Estimated time: ~${Math.round((total * DELAY_MS) / 60000)} minutes\n`);

  let existing = new Set();
  if (isResume) {
    console.log('📋 Checking existing chapters in DB...');
    existing = await getExistingChapters();
    const skipping = ALL_CHAPTERS.filter(c => existing.has(`${c.subject}|||${c.chapter}`)).length;
    console.log(`   ${skipping} already seeded → will skip. ${total - skipping} remaining.\n`);
  }

  let success = 0, failed = 0, skipped = 0;
  const failures = [];

  for (let i = 0; i < ALL_CHAPTERS.length; i++) {
    const { subject, chapter } = ALL_CHAPTERS[i];
    const key = `${subject}|||${chapter}`;
    const idx = `[${i + 1}/${total}]`;

    if (isResume && existing.has(key)) {
      console.log(`${idx} ⏭  SKIP  ${subject} — ${chapter}`);
      skipped++;
      continue;
    }

    process.stdout.write(`${idx} ⏳ ${subject} — ${chapter} ... `);

    try {
      const result = await seedChapter(subject, chapter);
      if (result.success) {
        const sets = result.setsGenerated ?? '?';
        console.log(`✅ ${sets} sets generated`);
        success++;
      } else {
        console.log(`❌ FAIL:`, JSON.stringify(result));
        failed++;
        failures.push({ subject, chapter, error: JSON.stringify(result) });
      }
    } catch (e) {
      console.log(`❌ ERROR: ${e.message}`);
      failed++;
      failures.push({ subject, chapter, error: e.message });
    }

    // Don't wait after the last chapter
    if (i < ALL_CHAPTERS.length - 1) {
      const remainingMin = Math.round(((ALL_CHAPTERS.length - i - 1) * DELAY_MS) / 60000);
      console.log(`   ⏳ Waiting 120s... (~${remainingMin} min remaining)`);
      await wait(DELAY_MS);
    }
  }

  // ── Final summary ──
  console.log('\n' + '='.repeat(50));
  console.log('📊 SEEDING COMPLETE');
  console.log('='.repeat(50));
  console.log(`✅ Success : ${success}`);
  console.log(`❌ Failed  : ${failed}`);
  console.log(`⏭  Skipped : ${skipped}`);
  console.log(`📚 Total   : ${total}`);

  if (failures.length > 0) {
    console.log('\n--- FAILED CHAPTERS ---');
    failures.forEach(f => console.log(`  ${f.subject} — ${f.chapter}: ${f.error}`));
    console.log('\n▶  Re-run with: node src/scripts/seedAllChapters.js --resume');
  } else {
    console.log('\n🎉 All chapters seeded! Now run topUpTo5.js to ensure each has ≥5 sets.');
  }
}

run();
