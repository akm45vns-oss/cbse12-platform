import fs from 'fs';
import path from 'path';

const statsViewPath = path.resolve('src/components/views/StatsView.jsx');
let statsViewContent = fs.readFileSync(statsViewPath, 'utf8');

statsViewContent = statsViewContent.replace('export const StatsView = memo(function StatsView() {', 'export const StatsView = memo(function StatsView({ curriculumData }) {');
statsViewContent = statsViewContent.replace(/CURRICULUM/g, 'curriculumData');
statsViewContent = statsViewContent.replace('getOverallStats()', 'getOverallStats(curriculumData)');
statsViewContent = statsViewContent.replace('getSubjectPerformance()', 'getSubjectPerformance(curriculumData)');
statsViewContent = statsViewContent.replace('getTopicMastery()', 'getTopicMastery(curriculumData)');
statsViewContent = statsViewContent.replace('getStudyTrends(progress.data)', 'getStudyTrends(progress.data, curriculumData)');
statsViewContent = statsViewContent.replace('getQuizPerformanceMetrics()', 'getQuizPerformanceMetrics(curriculumData)');
statsViewContent = statsViewContent.replace('getPersonalizedInsights(progress.data, topicMast, perfData)', 'getPersonalizedInsights(progress.data, topicMast, perfData, curriculumData)');

fs.writeFileSync(statsViewPath, statsViewContent);

const appPath = path.resolve('src/App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace('<StatsView theme={theme} />', '<StatsView theme={theme} curriculumData={activeCurriculum} />');
fs.writeFileSync(appPath, appContent);

const sessionTrackingPath = path.resolve('src/utils/sessionTracking.js');
let sessionTrackingContent = fs.readFileSync(sessionTrackingPath, 'utf8');

const isInCurriculumCode = `
export function isInCurriculum(subject, chapter, curriculum) {
  if (!curriculum) return true;
  if (!curriculum[subject]) return false;
  if (!chapter) return true;
  return curriculum[subject].units.some(u => u.chapters.includes(chapter));
}
`;

if (!sessionTrackingContent.includes('isInCurriculum')) {
  sessionTrackingContent = sessionTrackingContent.replace('export function getOverallStats', isInCurriculumCode + '\nexport function getOverallStats');
}

sessionTrackingContent = sessionTrackingContent.replace('export function getOverallStats() {', 'export function getOverallStats(activeCurriculum) {');
sessionTrackingContent = sessionTrackingContent.replace('const history = getSessionHistory();', 'let history = getSessionHistory();\n  if (activeCurriculum) {\n    history = history.filter(s => isInCurriculum(s.subject, s.chapter, activeCurriculum));\n  }');

fs.writeFileSync(sessionTrackingPath, sessionTrackingContent);

const analyticsEnginePath = path.resolve('src/utils/analyticsEngine.js');
let analyticsEngineContent = fs.readFileSync(analyticsEnginePath, 'utf8');

if (!analyticsEngineContent.includes('isInCurriculum')) {
  analyticsEngineContent = 'import { isInCurriculum } from "./sessionTracking.js";\n' + analyticsEngineContent;
}

analyticsEngineContent = analyticsEngineContent.replace('export function getSubjectPerformance() {', 'export function getSubjectPerformance(activeCurriculum) {');
analyticsEngineContent = analyticsEngineContent.replace('const submissions = JSON.parse(', 'let submissions = JSON.parse(');
analyticsEngineContent = analyticsEngineContent.replace('localStorage.getItem("akmedu_quiz_submissions") || "[]"\n    );', 'localStorage.getItem("akmedu_quiz_submissions") || "[]"\n    );\n    if (activeCurriculum) {\n      submissions = submissions.filter(s => isInCurriculum(s.subject, s.chapter, activeCurriculum));\n    }');

analyticsEngineContent = analyticsEngineContent.replace('export function getTopicMastery() {', 'export function getTopicMastery(activeCurriculum) {');
analyticsEngineContent = analyticsEngineContent.replace('export function getTopicMastery(activeCurriculum) {\n  try {\n    const submissions = JSON.parse(', 'export function getTopicMastery(activeCurriculum) {\n  try {\n    let submissions = JSON.parse(');
// need regex for getTopicMastery
analyticsEngineContent = analyticsEngineContent.replace(
  /export function getTopicMastery\(activeCurriculum\) \{\n  try \{\n    const submissions = JSON\.parse\(\n      localStorage\.getItem\("akmedu_quiz_submissions"\) \|\| "\[\]"\n    \);/g,
  'export function getTopicMastery(activeCurriculum) {\n  try {\n    let submissions = JSON.parse(\n      localStorage.getItem("akmedu_quiz_submissions") || "[]"\n    );\n    if (activeCurriculum) {\n      submissions = submissions.filter(s => isInCurriculum(s.subject, s.chapter, activeCurriculum));\n    }'
);


analyticsEngineContent = analyticsEngineContent.replace('export function getStudyTrends(progressData) {', 'export function getStudyTrends(progressData, activeCurriculum) {');
analyticsEngineContent = analyticsEngineContent.replace(
  /const sessions = JSON\.parse\(\n      localStorage\.getItem\("akmedu_sessions_history"\) \|\| "\[\]"\n    \);/g,
  'let sessions = JSON.parse(\n      localStorage.getItem("akmedu_sessions_history") || "[]"\n    );\n    if (activeCurriculum) {\n      sessions = sessions.filter(s => isInCurriculum(s.subject, s.chapter, activeCurriculum));\n    }'
);

analyticsEngineContent = analyticsEngineContent.replace('export function getPersonalizedInsights(progressData, weakTopics, performance) {', 'export function getPersonalizedInsights(progressData, weakTopics, performance, activeCurriculum) {');
analyticsEngineContent = analyticsEngineContent.replace('const trends = getStudyTrends(progressData);', 'const trends = getStudyTrends(progressData, activeCurriculum);');

analyticsEngineContent = analyticsEngineContent.replace('export function getQuizPerformanceMetrics() {', 'export function getQuizPerformanceMetrics(activeCurriculum) {');
analyticsEngineContent = analyticsEngineContent.replace(
  /const submissions = JSON\.parse\(\n      localStorage\.getItem\("akmedu_quiz_submissions"\) \|\| "\[\]"\n    \);/g,
  'let submissions = JSON.parse(\n      localStorage.getItem("akmedu_quiz_submissions") || "[]"\n    );\n    if (activeCurriculum) {\n      submissions = submissions.filter(s => isInCurriculum(s.subject, s.chapter, activeCurriculum));\n    }'
);


fs.writeFileSync(analyticsEnginePath, analyticsEngineContent);

console.log("Stats class-wise refactoring completed!");
