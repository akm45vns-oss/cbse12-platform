import fs from 'fs';
import path from 'path';

// 1. App.jsx
const appPath = path.resolve('src/App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace(
  '<LeaderboardView />',
  '<LeaderboardView selectedClass={selectedClass} curriculumData={activeCurriculum} />'
);
fs.writeFileSync(appPath, appContent);

// 2. LeaderboardView.jsx
const lvPath = path.resolve('src/components/views/LeaderboardView.jsx');
let lvContent = fs.readFileSync(lvPath, 'utf8');
lvContent = lvContent.replace(
  "import { CURRICULUM } from '../../constants/curriculum';",
  ""
);
lvContent = lvContent.replace(
  "const LeaderboardView = memo(function LeaderboardView() {",
  "export const LeaderboardView = memo(function LeaderboardView({ selectedClass, curriculumData }) {"
);
// In case the export default is at the bottom, I will just remove it if I add export to const.
// Let's just do `const LeaderboardView = memo(function LeaderboardView({ selectedClass, curriculumData }) {`
// and keep export default LeaderboardView at the bottom.
lvContent = lvContent.replace(
  "export const LeaderboardView = memo(function LeaderboardView({ selectedClass, curriculumData }) {",
  "const LeaderboardView = memo(function LeaderboardView({ selectedClass, curriculumData }) {"
);

lvContent = lvContent.replace(
  "const [selectedSubject, setSelectedSubject] = useState(Object.keys(CURRICULUM)[0] || '');",
  "const [selectedSubject, setSelectedSubject] = useState(Object.keys(curriculumData)[0] || '');"
);
lvContent = lvContent.replace(
  "const subjectData = CURRICULUM[selectedSubject];",
  "const subjectData = curriculumData[selectedSubject];"
);
// Pass selectedClass to fetch calls
lvContent = lvContent.replace(
  "const data = await getLeaderboardData(selectedSubject, selectedChapter, 25);",
  "const data = await getLeaderboardData(selectedClass, selectedSubject, selectedChapter, 25);"
);
lvContent = lvContent.replace(
  "const rank = await getUserRank(username, selectedSubject, selectedChapter);",
  "const rank = await getUserRank(selectedClass, username, selectedSubject, selectedChapter);"
);
lvContent = lvContent.replace(
  "const data = await getLeaderboardData(selectedSubject, null, 25);",
  "const data = await getLeaderboardData(selectedClass, selectedSubject, null, 25);"
);
lvContent = lvContent.replace(
  "const rank = await getUserRank(username, selectedSubject, null);",
  "const rank = await getUserRank(selectedClass, username, selectedSubject, null);"
);

// If selectedClass changes, we should reset selectedSubject if it's not in new curriculum,
// but the easiest is just to add selectedClass to useEffect dependencies.
lvContent = lvContent.replace(
  "}, [selectedSubject, selectedChapter, viewType, username]);",
  "}, [selectedClass, selectedSubject, selectedChapter, viewType, username]);"
);
lvContent = lvContent.replace(
  "}, [selectedSubject]);",
  "}, [selectedClass, selectedSubject, curriculumData]);"
);
fs.writeFileSync(lvPath, lvContent);

// 3. leaderboard.js
const lbPath = path.resolve('src/utils/leaderboard.js');
let lbContent = fs.readFileSync(lbPath, 'utf8');
lbContent = lbContent.replace(
  "function getCacheKey(subject, chapter, limit) {",
  "function getCacheKey(classLevel, subject, chapter, limit) {"
);
lbContent = lbContent.replace(
  "return `${subject}:${chapter || 'all'}:${limit}`;",
  "return `${classLevel}:${subject}:${chapter || 'all'}:${limit}`;"
);
lbContent = lbContent.replace(
  "export async function getLeaderboardData(subject, chapter = null, limit = 25) {",
  "export async function getLeaderboardData(classLevel, subject, chapter = null, limit = 25) {"
);
lbContent = lbContent.replace(
  "const cacheKey = getCacheKey(subject, chapter, limit);",
  "const cacheKey = getCacheKey(classLevel, subject, chapter, limit);"
);
lbContent = lbContent.replace(
  ".eq('subject', subject);",
  ".eq('class_level', classLevel).eq('subject', subject);"
);

lbContent = lbContent.replace(
  "export async function getUserRank(username, subject, chapter = null) {",
  "export async function getUserRank(classLevel, username, subject, chapter = null) {"
);
lbContent = lbContent.replace(
  "let query = supabase\n    .from('quiz_submissions')\n    .select('username, score')\n    .eq('subject', subject);",
  "let query = supabase\n    .from('quiz_submissions')\n    .select('username, score')\n    .eq('class_level', classLevel)\n    .eq('subject', subject);"
);

fs.writeFileSync(lbPath, lbContent);

console.log("Leaderboard updated!");
