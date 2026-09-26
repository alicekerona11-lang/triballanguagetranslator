/* ==========================================================================
   OFFICIAL MOCK DATA REPOSITORY
   Curriculum, Users, Schools, Sync Logs, Flashcards, and Translation Corpora
   ========================================================================== */

const GOV_DATA = {
  // Statistics for Authority Overview
  statistics: {
    registeredSchools: "482",
    teachers: "1,840",
    students: "42,910",
    learningMaterials: "3,250"
  },

  // Teacher Profile Data
  teacherProfile: {
    name: "Smt. Sunita Soren",
    designation: "Assistant Primary Teacher",
    schoolName: "Government Tribal Residential School, Dumka, Jharkhand",
    schoolCode: "UDISE+ 20140204901",
    assignedClass: "Class 5 - Language & Environmental Studies",
    currentPair: "Hindi ↔ Santali (Ol Chiki)"
  },

  // Student Progress Data (As requested in prompt)
  studentProgress: [
    { id: "STU-01", name: "Student 01 (Sunita Murmu)", rollNo: "0501", progress: 72, lastActive: "Today", status: "On Track" },
    { id: "STU-02", name: "Student 02 (Birsa Hembrom)", rollNo: "0502", progress: 64, lastActive: "Yesterday", status: "Needs Review" },
    { id: "STU-03", name: "Student 03 (Maino Hansda)", rollNo: "0503", progress: 81, lastActive: "Today", status: "Excellent" },
    { id: "STU-04", name: "Student 04 (Hopna Tudu)", rollNo: "0504", progress: 58, lastActive: "Today", status: "On Track" },
    { id: "STU-05", name: "Student 05 (Shanti Soren)", rollNo: "0505", progress: 90, lastActive: "2 days ago", status: "Completed Module 1" }
  ],

  // Curriculum Management (Authority)
  curriculum: [
    {
      course: "Primary Santali-Hindi Bridge Curriculum",
      language: "Santali (Ol Chiki) ↔ Hindi",
      classes: "Classes 1 to 5",
      status: "Approved",
      version: "v2.4",
      action: "Manage"
    },
    {
      course: "Foundational Ol Chiki Literacy & Phonics",
      language: "Santali (Ol Chiki)",
      classes: "Class 1 & 2",
      status: "Approved",
      version: "v3.1",
      action: "Manage"
    },
    {
      course: "Environmental Studies & Tribal Heritage",
      language: "Bilingual (Santali / Hindi)",
      classes: "Classes 4 & 5",
      status: "Under Review",
      version: "v1.2",
      action: "Review"
    },
    {
      course: "Mundari Oral Folk Tales & Number Sense",
      language: "Mundari ↔ Hindi",
      classes: "Class 1 & 2",
      status: "Pilot Stage",
      version: "v0.9",
      action: "Inspect"
    },
    {
      course: "Ho Language Early Childhood Balvatika Module",
      language: "Ho (Warang Chiti) ↔ Hindi",
      classes: "Balvatika",
      status: "Draft",
      version: "v0.4",
      action: "Edit"
    }
  ],

  // User Management (Authority)
  users: [
    {
      name: "Ramesh Chandra Soren",
      role: "Teacher",
      school: "Govt Tribal High School, Dumka",
      status: "Active",
      lastLogin: "Today, 08:30 AM"
    },
    {
      name: "Anjali Marandi",
      role: "Teacher",
      school: "Model Residential School, Ranchi",
      status: "Active",
      lastLogin: "Today, 09:12 AM"
    },
    {
      name: "Dr. Sunil Kumar Verma",
      role: "Block Education Officer",
      school: "Dumka District Education Office",
      status: "Active",
      lastLogin: "Yesterday, 04:20 PM"
    },
    {
      name: "Shanti Murmu",
      role: "District Inspector",
      school: "Tribal Welfare Dept, Jharkhand",
      status: "Active",
      lastLogin: "Today, 11:05 AM"
    },
    {
      name: "Priya Kumari",
      role: "Curriculum Coordinator",
      school: "SCERT Tribal Language Cell",
      status: "Active",
      lastLogin: "24 Sep 2026"
    }
  ],

  // System Synchronization Data (Authority)
  synchronization: [
    {
      deviceSchool: "Dumka Tribal Residential Hub #04",
      lastSync: "Today, 10:32 AM",
      pendingData: "0 Records",
      status: "Sync Complete",
      statusType: "success"
    },
    {
      deviceSchool: "Ranchi Model Lab Terminal #01",
      lastSync: "Today, 09:15 AM",
      pendingData: "2 Audio Lessons",
      status: "Synchronizing...",
      statusType: "syncing"
    },
    {
      deviceSchool: "Chaibasa Block Primary Unit #12",
      lastSync: "Yesterday, 04:45 PM",
      pendingData: "14 Assessment Logs",
      status: "Working Offline",
      statusType: "warning"
    },
    {
      deviceSchool: "Gumla Ashram School Tablet Hub",
      lastSync: "Today, 11:00 AM",
      pendingData: "0 Records",
      status: "Sync Complete",
      statusType: "success"
    },
    {
      deviceSchool: "Pakur Eklavya Model School Lab",
      lastSync: "Today, 07:45 AM",
      pendingData: "0 Records",
      status: "Sync Complete",
      statusType: "success"
    }
  ],

  // Classroom Translation Phrasebook (Authentic Hindi <-> Santali in Ol Chiki & Devanagari)
  translationCorpus: [
    {
      id: "phr-1",
      sourceHindi: "नमस्ते बच्चों, आज हम प्रकृति के बारे में पढ़ेंगे।",
      sourceEnglish: "Good morning students, today we will learn about nature.",
      targetSantaliOlChiki: "ᱡᱚᱦᱟᱨ ᱯᱟᱹᱴᱷᱩᱣᱟᱹ ᱠᱚ, ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱯᱨᱚᱠᱨᱤᱛᱤ ᱵᱟᱵᱚᱛ ᱵᱚᱱ ᱯᱟᱲᱦᱟᱣᱜ-ᱟ ᱾",
      targetSantaliRoman: "Johar pathuwa ko, tehenj do abo prokriti babot bon padhaoga.",
      audioPhonetic: "Johar pathuwa ko, tehenj do abo prokriti babot bon padhaog-a."
    },
    {
      id: "phr-2",
      sourceHindi: "नमस्ते बच्चों।",
      sourceEnglish: "Good morning students.",
      targetSantaliOlChiki: "ᱡᱚᱦᱟᱨ ᱯᱟᱹᱴᱷᱩᱣᱟᱹ ᱠᱚ ᱾",
      targetSantaliRoman: "Johar pathuwa ko.",
      audioPhonetic: "Johar pathuwa ko."
    },
    {
      id: "phr-3",
      sourceHindi: "अपनी किताबें खोलिए।",
      sourceEnglish: "Open your books.",
      targetSantaliOlChiki: "ᱟᱯᱮᱭᱟᱜ ᱯᱩᱛᱷᱤ ᱠᱚ ᱡᱷᱤᱡᱽ ᱯᱮ ᱾",
      targetSantaliRoman: "Apeyag puthi ko jhij pe.",
      audioPhonetic: "Apeyag puthi ko jhij pe."
    },
    {
      id: "phr-4",
      sourceHindi: "ध्यान से सुनिए।",
      sourceEnglish: "Listen carefully.",
      targetSantaliOlChiki: "ᱢᱚᱱ ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱟᱸᱡᱚᱢ ᱯᱮ ᱾",
      targetSantaliRoman: "Mon dhyan te anjom pe.",
      audioPhonetic: "Mon dhyan te anjom pe."
    },
    {
      id: "phr-5",
      sourceHindi: "क्या आपका कोई प्रश्न है?",
      sourceEnglish: "Do you have any questions?",
      targetSantaliOlChiki: "ᱟᱯᱮᱭᱟᱜ ᱪᱮᱫ ᱠᱩᱠᱞᱤ ᱢᱮᱱᱟᱜ-ᱟ?",
      targetSantaliRoman: "Apeyag ched kukli menag-a?",
      audioPhonetic: "Apeyag ched kukli menag-a?"
    },
    {
      id: "phr-6",
      sourceHindi: "बहुत अच्छा!",
      sourceEnglish: "Very good!",
      targetSantaliOlChiki: "ᱟᱹᱰᱤ ᱱᱟᱯᱟᱭ!",
      targetSantaliRoman: "Adi napay!",
      audioPhonetic: "Adi napay!"
    },
    {
      id: "phr-7",
      sourceHindi: "कृपया बैठ जाइए।",
      sourceEnglish: "Please sit down.",
      targetSantaliOlChiki: "ᱫᱟᱭᱟ ᱠᱟᱛᱮ ᱫᱩᱲᱩᱵ ᱯᱮ ᱾",
      targetSantaliRoman: "Daya kate durub pe.",
      audioPhonetic: "Daya kate durub pe."
    },
    {
      id: "phr-8",
      sourceHindi: "आइए हम सब मिलकर पढ़ें।",
      sourceEnglish: "Let us read together.",
      targetSantaliOlChiki: "ᱫᱮᱞᱟᱵᱚᱱ ᱡᱚᱛᱚ ᱦᱚᱲ ᱢᱤᱫ ᱛᱮᱵᱚᱱ ᱯᱟᱲᱦᱟᱣ-ᱟ ᱾",
      targetSantaliRoman: "Delabon joto hor mid tebon padhaw-a.",
      audioPhonetic: "Delabon joto hor mid tebon padhaw-a."
    }
  ],

  // Interactive Flashcards (Ol Chiki script with Hindi & Romanized Santali)
  flashcards: [
    {
      id: 1,
      script: "ᱚ",
      roman: "Laa",
      hindiMeaning: "धरती / ज़मीन",
      englishMeaning: "Earth / Soil",
      exampleWord: "ᱚᱛ (Ot - Earth)"
    },
    {
      id: 2,
      script: "ᱛ",
      roman: "At",
      hindiMeaning: "हाथ / पंजा",
      englishMeaning: "Hand / Palm",
      exampleWord: "ᱛᱤ (Ti - Hand)"
    },
    {
      id: 3,
      script: "ᱜ",
      roman: "Ag",
      hindiMeaning: "धनुष",
      englishMeaning: "Bow (Archery)",
      exampleWord: "ᱟᱜ (Aak - Bow)"
    },
    {
      id: 4,
      script: "ᱝ",
      roman: "Ang",
      hindiMeaning: "हवा / वायु",
      englishMeaning: "Wind / Air",
      exampleWord: "ᱦᱚᱭ (Hoy - Wind)"
    },
    {
      id: 5,
      script: "ᱞ",
      roman: "Al",
      hindiMeaning: "लिखना / लिपि",
      englishMeaning: "Writing / Script",
      exampleWord: "ᱚᱞ ᱪᱤᱠᱤ (Ol Chiki - Script)"
    },
    {
      id: 6,
      script: "ᱟ",
      roman: "Aah",
      hindiMeaning: "मुँह / वाणी",
      englishMeaning: "Mouth / Voice",
      exampleWord: "ᱟᱲᱟᱝ (Arang - Sound)"
    },
    {
      id: 7,
      script: "ᱠ",
      roman: "Ak",
      hindiMeaning: "हंस / चिड़िया",
      englishMeaning: "Goose / Bird",
      exampleWord: "ᱪᱮᱬᱮ (Chene - Bird)"
    },
    {
      id: 8,
      script: "ᱡ",
      roman: "Aj",
      hindiMeaning: "पेड़ / वृक्ष",
      englishMeaning: "Tree / Plant",
      exampleWord: "ᱫᱟᱨᱮ (Dare - Tree)"
    },
    {
      id: 9,
      script: "ᱢ",
      roman: "Am",
      hindiMeaning: "आँख / दृष्टि",
      englishMeaning: "Eye / Sight",
      exampleWord: "ᱢᱮᱫ (Med - Eye)"
    },
    {
      id: 10,
      script: "ᱣ",
      roman: "Aw",
      hindiMeaning: "जल / पानी",
      englishMeaning: "Water / Stream",
      exampleWord: "ᱫᱟᱜ (Dak - Water)"
    }
  ],

  // Student Lessons List
  studentLessons: [
    {
      id: "les-01",
      number: "Lesson 01",
      titleSantali: "ᱚᱞ ᱪᱤᱠᱤ ᱢᱩᱬᱩᱛ ᱟᱠᱷᱚᱨ (Ol Chiki Alphabet Basics)",
      titleHindi: "ओल चिकी मूल वर्णमाला परिचय",
      duration: "15 mins",
      type: "Phonics & Script",
      status: "Completed",
      score: "100%"
    },
    {
      id: "les-02",
      number: "Lesson 02",
      titleSantali: "ᱟᱵᱚᱣᱟᱜ ᱚᱲᱟᱜ ᱟᱨ ᱜᱷᱟᱨᱚᱸᱡᱽ (Our Home & Family)",
      titleHindi: "हमारा घर और परिवार शब्दावली",
      duration: "20 mins",
      type: "Vocabulary & Reading",
      status: "In Progress",
      score: "72%"
    },
    {
      id: "les-03",
      number: "Lesson 03",
      titleSantali: "ᱫᱟᱨᱮ ᱱᱟᱹᱲᱤ ᱟᱨ ᱡᱤᱵᱽ ᱡᱤᱭᱟᱹᱞᱤ (Trees & Forest Animals)",
      titleHindi: "पेड़-पौधे एवं वन जीव",
      duration: "25 mins",
      type: "Environmental Studies",
      status: "Next Up",
      score: "Pending"
    },
    {
      id: "les-04",
      number: "Lesson 04",
      titleSantali: "ᱮᱞᱠᱷᱟ ᱟᱨ ᱞᱮᱠᱷᱟ ᱑ ᱠᱷᱚᱱ ᱒᱐ (Numbers 1 to 20)",
      titleHindi: "गिनती १ से २० तक",
      duration: "18 mins",
      type: "Bilingual Numeracy",
      status: "Locked",
      score: "Pending"
    }
  ]
};
