// ===== CURRICULUM DATA =====
export const CURRICULUM = {
  Physics: {
    emoji: "⚛️", code: "PHY",
    gradient: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
    accent: "#3b82f6", light: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe",
    units: [
      { name: "Unit I — Electrostatics", chapters: ["Electric Charges and Fields", "Electrostatic Potential and Capacitance"] },
      { name: "Unit II — Current Electricity", chapters: ["Current Electricity"] },
      { name: "Unit III — Magnetic Effects of Current", chapters: ["Moving Charges and Magnetism", "Magnetism and Matter"] },
      { name: "Unit IV — Electromagnetic Induction & AC", chapters: ["Electromagnetic Induction", "Alternating Current"] },
      { name: "Unit V — Electromagnetic Waves", chapters: ["Electromagnetic Waves"] },
      { name: "Unit VI — Optics", chapters: ["Ray Optics and Optical Instruments", "Wave Optics"] },
      { name: "Unit VII — Dual Nature of Radiation", chapters: ["Dual Nature of Radiation and Matter"] },
      { name: "Unit VIII — Atoms & Nuclei", chapters: ["Atoms", "Nuclei"] },
      { name: "Unit IX — Electronic Devices", chapters: ["Semiconductor Electronics: Materials, Devices and Simple Circuits"] },
    ]
  },
  Chemistry: {
    emoji: "🧪", code: "CHE",
    gradient: "linear-gradient(135deg, #065f46 0%, #10b981 50%, #6ee7b7 100%)",
    accent: "#10b981", light: "#ecfdf5", text: "#065f46", border: "#a7f3d0",
    units: [
      { name: "Unit I — Solid State & Solutions", chapters: ["The Solid State", "Solutions"] },
      { name: "Unit II — Electrochemistry & Kinetics", chapters: ["Electrochemistry", "Chemical Kinetics"] },
      { name: "Unit III — Surface Chemistry", chapters: ["Surface Chemistry"] },
      { name: "Unit IV — Metallurgy & p-Block", chapters: ["General Principles and Processes of Isolation of Elements", "The p-Block Elements (Groups 15–18)"] },
      { name: "Unit V — d,f-Block & Coordination", chapters: ["The d and f Block Elements", "Coordination Compounds"] },
      { name: "Unit VI — Organic: Haloalkanes & Alcohols", chapters: ["Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers"] },
      { name: "Unit VII — Organic: Carbonyl & Amines", chapters: ["Aldehydes, Ketones and Carboxylic Acids", "Amines"] },
      { name: "Unit VIII — Biomolecules, Polymers & Everyday Chemistry", chapters: ["Biomolecules", "Polymers", "Chemistry in Everyday Life"] },
    ]
  },
  Biology: {
    emoji: "🌿", code: "BIO",
    gradient: "linear-gradient(135deg, #14532d 0%, #16a34a 50%, #86efac 100%)",
    accent: "#16a34a", light: "#f0fdf4", text: "#15803d", border: "#bbf7d0",
    units: [
      { name: "Unit I — Reproduction", chapters: ["Reproduction in Organisms", "Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health"] },
      { name: "Unit II — Genetics & Evolution", chapters: ["Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution"] },
      { name: "Unit III — Biology in Human Welfare", chapters: ["Human Health and Disease", "Strategies for Enhancement in Food Production", "Microbes in Human Welfare"] },
      { name: "Unit IV — Biotechnology", chapters: ["Biotechnology: Principles and Processes", "Biotechnology and its Applications"] },
      { name: "Unit V — Ecology", chapters: ["Organisms and Populations", "Ecosystem", "Biodiversity and Conservation", "Environmental Issues"] },
    ]
  },
  English: {
    emoji: "📖", code: "ENG",
    gradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #c4b5fd 100%)",
    accent: "#7c3aed", light: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe",
    units: [
      { name: "Flamingo — Prose", chapters: ["The Last Lesson", "Lost Spring", "Deep Water", "The Rattrap", "Indigo", "Poets and Pancakes", "The Interview", "Going Places"] },
      { name: "Flamingo — Poetry", chapters: ["My Mother at Sixty-Six", "An Elementary School Classroom in a Slum", "Keeping Quiet", "A Thing of Beauty", "A Roadside Stand", "Aunt Jennifer's Tigers"] },
      { name: "Vistas (Supplementary)", chapters: ["The Third Level", "The Tiger King", "Journey to the End of the Earth", "The Enemy", "Should Wizard Hit Mommy", "On the Face of It", "Evans Tries an O-Level", "Memories of Childhood"] },
      { name: "Writing Skills", chapters: ["Notice Writing", "Formal Letter Writing", "Article Writing", "Report Writing", "Speech Writing"] },
    ]
  },
  Mathematics: {
    emoji: "📐", code: "MAT",
    gradient: "linear-gradient(135deg, #92400e 0%, #f59e0b 50%, #fcd34d 100%)",
    accent: "#f59e0b", light: "#fffbeb", text: "#92400e", border: "#fde68a",
    units: [
      { name: "Unit I — Relations & Functions", chapters: ["Relations and Functions", "Inverse Trigonometric Functions"] },
      { name: "Unit II — Algebra", chapters: ["Matrices", "Determinants"] },
      { name: "Unit III — Calculus", chapters: ["Continuity and Differentiability", "Application of Derivatives", "Integrals", "Application of Integrals", "Differential Equations"] },
      { name: "Unit IV — Vectors & 3D Geometry", chapters: ["Vector Algebra", "Three Dimensional Geometry"] },
      { name: "Unit V — Linear Programming", chapters: ["Linear Programming"] },
      { name: "Unit VI — Probability", chapters: ["Probability"] },
    ]
  },
  "Computer Science": {
    emoji: "💻", code: "CS",
    gradient: "linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 50%, #7dd3fc 100%)",
    accent: "#0ea5e9", light: "#f0f9ff", text: "#0369a1", border: "#bae6fd",
    units: [
      { name: "Unit I — Programming in Python", chapters: ["Python Revision Tour", "Functions", "File Handling", "Exception Handling"] },
      { name: "Unit II — Data Structures", chapters: ["Stack", "Queue", "Linked List (Theory)"] },
      { name: "Unit III — Database Management", chapters: ["Database Concepts", "Structured Query Language (SQL)", "MySQL Functions and Grouping"] },
      { name: "Unit IV — Networking & Web", chapters: ["Computer Networks", "Network Security Concepts", "Web Technologies Basics"] },
      { name: "Unit V — Society, Law & Ethics", chapters: ["Cyber Safety", "Intellectual Property Rights", "IT Act and Cyber Crime", "E-waste Management"] },
    ]
  },
  Economics: {
    emoji: "📈", code: "ECO",
    gradient: "linear-gradient(135deg, #134e4a 0%, #14b8a6 50%, #5eead4 100%)",
    accent: "#14b8a6", light: "#f0fdfa", text: "#0f766e", border: "#99f6e4",
    units: [
      { name: "Part A — Introductory Microeconomics", chapters: ["Introduction to Microeconomics", "Consumer Equilibrium and Demand", "Producer Behaviour and Supply", "Forms of Market and Price Determination", "Simple Applications of Tools of Demand and Supply"] },
      { name: "Part B — Introductory Macroeconomics", chapters: ["National Income and Related Aggregates", "Money and Banking", "Determination of Income and Employment", "Government Budget and the Economy", "Balance of Payments and Foreign Exchange"] },
    ]
  },
  Accountancy: {
    emoji: "🧾", code: "ACC",
    gradient: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #93c5fd 100%)",
    accent: "#2563eb", light: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe",
    units: [
      { name: "Part I — Accounting for Not-for-Profit", chapters: ["Accounting for Not-for-Profit Organisations"] },
      { name: "Part I — Partnership Accounts", chapters: ["Accounting for Partnership: Basic Concepts", "Reconstitution of Partnership: Admission", "Reconstitution of Partnership: Retirement & Death", "Dissolution of Partnership Firm"] },
      { name: "Part II — Company Accounts", chapters: ["Accounting for Share Capital", "Issue and Redemption of Debentures"] },
      { name: "Part II — Financial Statements Analysis", chapters: ["Financial Statements of a Company", "Analysis of Financial Statements", "Accounting Ratios", "Cash Flow Statement"] },
    ]
  },
  "Business Studies": {
    emoji: "🏢", code: "BS",
    gradient: "linear-gradient(135deg, #4a1942 0%, #a21caf 50%, #e879f9 100%)",
    accent: "#a21caf", light: "#fdf4ff", text: "#86198f", border: "#f0abfc",
    units: [
      { name: "Part A — Principles & Functions of Management", chapters: ["Nature and Significance of Management", "Principles of Management", "Business Environment", "Planning", "Organising", "Staffing", "Directing", "Controlling"] },
      { name: "Part B — Business Finance & Marketing", chapters: ["Financial Management", "Financial Markets", "Marketing Management", "Consumer Protection", "Entrepreneurship Development"] },
    ]
  },
  History: {
    emoji: "🏛️", code: "HIS",
    gradient: "linear-gradient(135deg, #451a03 0%, #b45309 50%, #fcd34d 100%)",
    accent: "#b45309", light: "#fffbeb", text: "#92400e", border: "#fde68a",
    units: [
      { name: "Themes in Indian History — Part I", chapters: ["Bricks, Beads and Bones: The Harappan Civilisation", "Kings, Farmers and Towns", "Kinship, Caste and Class", "Thinkers, Beliefs and Buildings", "Through the Eyes of Travellers"] },
      { name: "Themes in Indian History — Part II", chapters: ["Bhakti–Sufi Traditions", "An Imperial Capital: Vijayanagara", "Peasants, Zamindars and the State", "Kings and Chronicles: The Mughal Courts", "Colonialism and the Countryside"] },
      { name: "Themes in Indian History — Part III", chapters: ["Rebels and the Raj: 1857 Revolt", "Colonial Cities", "Mahatma Gandhi and the Nationalist Movement", "Understanding Partition", "Framing the Constitution"] },
    ]
  },
  "Political Science": {
    emoji: "🗳️", code: "POL",
    gradient: "linear-gradient(135deg, #1c1917 0%, #dc2626 50%, #fca5a5 100%)",
    accent: "#dc2626", light: "#fef2f2", text: "#b91c1c", border: "#fecaca",
    units: [
      { name: "Part A — Contemporary World Politics", chapters: ["The Cold War Era", "The End of Bipolarity", "US Hegemony in World Politics", "Alternative Centres of Power", "Contemporary South Asia", "International Organisations", "Security in the Contemporary World", "Environment and Natural Resources", "Globalisation"] },
      { name: "Part B — Politics in India Since Independence", chapters: ["Challenges of Nation Building", "Era of One-Party Dominance", "Politics of Planned Development", "India's External Relations", "Challenges to the Congress System", "Crisis of the Constitutional Order", "Rise of Popular Movements", "Regional Aspirations", "Recent Developments in Indian Politics"] },
    ]
  },
  "Physical Education": {
    emoji: "🏃", code: "PE",
    gradient: "linear-gradient(135deg, #14532d 0%, #22c55e 50%, #86efac 100%)",
    accent: "#22c55e", light: "#f0fdf4", text: "#15803d", border: "#bbf7d0",
    units: [
      { name: "Unit I — Management of Sports", chapters: ["Management of Sporting Events", "Children and Women in Sports", "Yoga as Preventive Measure for Lifestyle Diseases"] },
      { name: "Unit II — Sports & Nutrition", chapters: ["Physical Education and Sports for CWSN", "Sports Nutrition", "Measurement and Evaluation in Sports"] },
      { name: "Unit III — Physical Activity & Health", chapters: ["Test and Measurement in Sports", "Biomechanics and Sports", "Psychology and Sports"] },
      { name: "Unit IV — Training & Physiology", chapters: ["Training in Sports", "Doping — Drugs in Sports", "Sports Medicine"] },
    ]
  },
};

export const totalChapters = Object.values(CURRICULUM).reduce(
  (a, s) => a + s.units.reduce((b, u) => b + u.chapters.length, 0),
  0
);
