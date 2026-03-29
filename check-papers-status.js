import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
  try {
    // Get all sample papers
    const { data: papers, error } = await supabase
      .from('sample_papers')
      .select('subject, set_number, total_marks')
      .order('subject', { ascending: true })
      .order('set_number', { ascending: true });

    if (error) throw error;

    console.log("\n" + "═".repeat(80));
    console.log("📊 SAMPLE PAPERS GENERATION STATUS");
    console.log("═".repeat(80) + "\n");

    if (!papers || papers.length === 0) {
      console.log("⏳ No papers generated yet...\n");
      return;
    }

    // Group by subject
    const bySubject = {};
    papers.forEach(p => {
      bySubject[p.subject] = bySubject[p.subject] || [];
      bySubject[p.subject].push(p);
    });

    const subjects = ["Physics", "Chemistry", "Biology", "English", "Mathematics", "Computer Science", "Economics", "Accountancy", "Business Studies", "History", "Political Science", "Physical Education"];

    let totalGenerated = 0;

    subjects.forEach(subject => {
      const subjectPapers = bySubject[subject] || [];
      const count = subjectPapers.length;
      const marks = subjectPapers[0]?.total_marks || "—";
      const status = count === 5 ? "✅ COMPLETE" : `🔄 ${count}/5`;
      totalGenerated += count;

      console.log(`${subject.padEnd(25)} ${status.padEnd(15)} (${marks} marks)`);
    });

    console.log("\n" + "─".repeat(80));
    console.log(`Total: ${totalGenerated}/60 papers generated`);

    const percentage = Math.round((totalGenerated / 60) * 100);
    const bar = "█".repeat(Math.floor(percentage / 5)) + "░".repeat(20 - Math.floor(percentage / 5));
    console.log(`Progress: [${bar}] ${percentage}%\n`);

    if (totalGenerated === 60) {
      console.log("🎉 ALL 60 SAMPLE PAPERS GENERATED AND STORED!\n");
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

checkStatus();
