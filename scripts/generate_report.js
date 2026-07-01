import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'cache', 'output');
const report = {};

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            scanDir(path.join(dir, entry.name));
        } else if (entry.name.endsWith('.json')) {
            // Path structure: cache/output/{classLevel}/{subject}/{chapter}/{contentType}.json
            const relative = path.relative(outDir, path.join(dir, entry.name));
            const parts = relative.split(path.sep);
            if (parts.length === 4) {
                const [cls, subject, chapter, file] = parts;
                const contentType = file.replace('.json', '');
                if (!report[cls]) report[cls] = {};
                if (!report[cls][subject]) report[cls][subject] = {};
                if (!report[cls][subject][chapter]) report[cls][subject][chapter] = [];
                report[cls][subject][chapter].push(contentType);
            }
        }
    }
}

scanDir(outDir);

let markdown = `# 📈 Class / Subject / Chapter Completion Report\n\n`;

for (const cls of Object.keys(report).sort()) {
    markdown += `## Class ${cls}\n\n`;
    for (const subject of Object.keys(report[cls]).sort()) {
        markdown += `### ${subject}\n\n`;
        markdown += `| Chapter | Completed Items |\n`;
        markdown += `| :--- | :--- |\n`;
        let subjectTotal = 0;
        for (const chapter of Object.keys(report[cls][subject]).sort()) {
            const types = report[cls][subject][chapter];
            subjectTotal += types.length;
            const typesFormatted = types.map(t => '`' + t + '`').join(', ');
            markdown += `| **${chapter.replace(/_/g, ' ')}** | ${types.length} items: ${typesFormatted} |\n`;
        }
        markdown += `\n**Total items in ${subject}:** ${subjectTotal}\n\n`;
    }
}

const artifactPath = 'completion_report_output.txt';
fs.writeFileSync(artifactPath, markdown);
console.log('Report successfully generated to artifact!');
