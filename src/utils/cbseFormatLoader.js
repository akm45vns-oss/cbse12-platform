// ===== CBSE FORMAT LOADER UTILITY =====
// Dynamically discovers and loads all CBSE format and weightage JSON configuration files from the format/ directory.

const formatModules = import.meta.glob('../../format/*-question-paper-format-2026-27.json', { eager: true });
const weightageModules = import.meta.glob('../../format/*-chapter-weightage-2026-27.json', { eager: true });

// Process and group the files by subject
const subjectsData = {};

// Helper to normalize subject names for robust lookups
const normalizeSubjectName = (name) => {
  if (!name) return "";
  return name.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
};

// 1. Process all question paper formats
for (const path in formatModules) {
  const data = formatModules[path]?.default || formatModules[path];
  if (!data || !data.subject) {
    console.warn(`[cbseFormatLoader] Skipping invalid format file: ${path} (missing subject name)`);
    continue;
  }
  const key = normalizeSubjectName(data.subject);
  if (!subjectsData[key]) {
    subjectsData[key] = { subjectName: data.subject };
  }
  subjectsData[key].format = data;
  subjectsData[key].formatPath = path;
}

// 2. Process all chapter weightage configurations
for (const path in weightageModules) {
  const data = weightageModules[path]?.default || weightageModules[path];
  if (!data || !data.subject) {
    console.warn(`[cbseFormatLoader] Skipping invalid weightage file: ${path} (missing subject name)`);
    continue;
  }
  const key = normalizeSubjectName(data.subject);
  if (!subjectsData[key]) {
    subjectsData[key] = { subjectName: data.subject };
  }
  subjectsData[key].weightage = data;
  subjectsData[key].weightagePath = path;
}

/**
 * Validates the loaded CBSE metadata for a subject to ensure no fields are missing or invalid.
 * If validation fails, it throws a descriptive error.
 */
function validateSubjectData(subjectKey, data) {
  const format = data.format;
  const weightage = data.weightage;

  if (!format) {
    throw new Error(`CBSE format configuration file is missing for subject: "${data.subjectName || subjectKey}".`);
  }
  if (!weightage) {
    throw new Error(`CBSE chapter weightage configuration file is missing for subject: "${data.subjectName || subjectKey}".`);
  }

  // 1. Validate Format Fields
  if (!format.subject) throw new Error(`Missing required field "subject" in ${data.formatPath}`);
  if (!format.subjectCode) throw new Error(`Missing required field "subjectCode" in ${data.formatPath}`);
  if (!format.session) throw new Error(`Missing required field "session" in ${data.formatPath}`);
  if (!format.exam || typeof format.exam.maximumMarks === 'undefined') {
    throw new Error(`Missing required field "exam.maximumMarks" in ${data.formatPath}`);
  }
  if (!format.questionPaper || !Array.isArray(format.questionPaper.sections) || format.questionPaper.sections.length === 0) {
    throw new Error(`Missing or empty "questionPaper.sections" array in ${data.formatPath}`);
  }

  // Validate Sections
  format.questionPaper.sections.forEach((sec, idx) => {
    if (!sec.section) throw new Error(`Section at index ${idx} is missing "section" identifier in ${data.formatPath}`);
    if (!sec.questionType) throw new Error(`Section ${sec.section} is missing "questionType" in ${data.formatPath}`);
    if (typeof sec.marksPerQuestion === 'undefined') throw new Error(`Section ${sec.section} is missing "marksPerQuestion" in ${data.formatPath}`);
    if (typeof sec.questions === 'undefined') throw new Error(`Section ${sec.section} is missing "questions" count in ${data.formatPath}`);
    if (typeof sec.totalMarks === 'undefined') throw new Error(`Section ${sec.section} is missing "totalMarks" in ${data.formatPath}`);
  });

  // 2. Validate Weightage Fields
  if (!weightage.chapters || !Array.isArray(weightage.chapters) || weightage.chapters.length === 0) {
    throw new Error(`Missing or empty "chapters" list in ${data.weightagePath}`);
  }

  // Validate Chapters
  weightage.chapters.forEach((ch, idx) => {
    if (typeof ch.chapterNumber === 'undefined') throw new Error(`Chapter at index ${idx} is missing "chapterNumber" in ${data.weightagePath}`);
    if (!ch.chapterName) throw new Error(`Chapter at index ${idx} is missing "chapterName" in ${data.weightagePath}`);
    if (!ch.expectedWeightage || typeof ch.expectedWeightage.min === 'undefined' || typeof ch.expectedWeightage.max === 'undefined') {
      throw new Error(`Chapter "${ch.chapterName}" is missing "expectedWeightage.min" or "expectedWeightage.max" in ${data.weightagePath}`);
    }
  });
}

export const cbseFormatLoader = {
  /**
   * Returns a list of all dynamically discovered subject names.
   */
  getAvailableSubjects() {
    return Object.values(subjectsData).map(s => s.subjectName);
  },

  /**
   * Fetches the complete question paper format and chapter weightages for a subject,
   * performing full validations on the loaded data.
   */
  getSubjectMetadata(subjectName) {
    if (!subjectName) {
      throw new Error("Subject name is required to load CBSE format configuration.");
    }
    const key = normalizeSubjectName(subjectName);
    const data = subjectsData[key];

    if (!data) {
      throw new Error(`No CBSE configuration files found for subject: "${subjectName}".`);
    }

    // Run deep validation checks
    validateSubjectData(key, data);

    return {
      subject: data.format.subject,
      subjectCode: data.format.subjectCode,
      session: data.format.session,
      board: data.format.board || "CBSE",
      duration: data.format.exam.duration,
      theoryMarks: data.format.exam.maximumMarks,
      internalChoice: data.format.internalChoice || { available: false },
      sections: data.format.questionPaper.sections,
      chapters: data.format.chapters || data.weightage.chapters,
      rawFormat: data.format,
      rawWeightage: data.weightage,
    };
  },

  /**
   * Helper to build dynamic prompt text representing instructions compiled from format JSON.
   */
  buildInstructionsText(metadata) {
    const list = [];
    list.push(`1. This question paper has ${metadata.sections.length} Sections: ${metadata.sections.map(s => s.section).join(", ")}.`);
    list.push(`2. All sections are compulsory.`);
    
    let currentIdx = 3;
    metadata.sections.forEach(sec => {
      list.push(`${currentIdx++}. Section ${sec.section} contains ${sec.questions} questions of ${sec.marksPerQuestion} mark(s) each, representing ${sec.questionType} questions.`);
    });

    if (metadata.internalChoice.available) {
      list.push(`${currentIdx++}. Internal choice of approximately ${metadata.internalChoice.percentage || "33%"} is provided in the paper.`);
    }
    list.push(`${currentIdx++}. No calculators or external tools are permitted.`);
    return list.join("\n");
  },

  /**
   * Helper to build dynamic prompt text representing the blueprint structure compiled from format JSON.
   */
  buildSectionsText(metadata) {
    return metadata.sections.map(sec => {
      return `- **SECTION ${sec.section}**: ${sec.questions} Questions (${sec.questionType}), carrying ${sec.marksPerQuestion} mark(s) each. Total marks for this section = ${sec.totalMarks}.`;
    }).join("\n");
  },

  /**
   * Helper to build dynamic prompt text representing the chapters & expected weightages.
   */
  buildSyllabusWeightageText(metadata) {
    return metadata.chapters.map(ch => {
      const unitStr = ch.unit ? `[Unit: ${ch.unit}] ` : ch.book ? `[Book: ${ch.book}] ` : "";
      return `- Chapter ${ch.chapterNumber}: ${unitStr}${ch.chapterName} (Expected weightage: ${ch.expectedWeightage.min}-${ch.expectedWeightage.max} marks)`;
    }).join("\n");
  }
};
