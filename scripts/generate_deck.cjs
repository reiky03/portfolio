const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333" x 7.5"
pres.title = 'Reiky Aryanando Pratama - Portfolio & Engineering Presentation';
pres.author = 'Reiky Aryanando Pratama';
pres.subject = 'Backend & Full-Stack Developer Portfolio';

// --- PALETTE CONSTANTS (Hex without '#') ---
const C = {
  darkBg: '0B1510',
  darkCard: '13261C',
  darkCardBorder: '213E2E',
  darkText: 'FFFFFF',
  darkTextSoft: 'A3B8AD',
  darkMuted: '70857A',
  
  paperBg: 'F7F5EE',
  cardBg: 'FFFFFF',
  cardBorder: 'E4E0D1',
  ink: '131E18',
  inkSoft: '3E4D44',
  muted: '6D7E74',
  
  emerald: '15803D',
  emeraldLight: 'EBF7EE',
  mint: '10B981',
  mintDark: '0D5E3A',
  mintSoft: 'D1FAE5',
  
  white: 'FFFFFF',
  frameBorder: 'CBD5E1',
  phoneFrame: '1E293B'
};

const imgPath = (name) => path.join(__dirname, '..', 'public', 'images', 'ppt', name);

// --- HELPER FUNCTIONS ---
function addTopNav(slide, category, slideNum, isDark = false) {
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 0.52, w: 2.8, h: 0.32,
    rectRadius: 0.16,
    fill: { color: isDark ? '193427' : 'EBF7EE' },
    line: { color: isDark ? '2A523E' : 'C2E5CD', width: 1 }
  });
  slide.addText(category.toUpperCase(), {
    x: 0.8, y: 0.52, w: 2.8, h: 0.32,
    fontSize: 9, fontFace: 'Calibri', bold: true,
    color: isDark ? '6EE7B7' : '15803D',
    align: 'center', valign: 'middle', margin: 0
  });

  slide.addText(slideNum, {
    x: 11.5, y: 0.52, w: 1.0, h: 0.32,
    fontSize: 10, fontFace: 'Calibri', bold: true,
    color: isDark ? C.darkMuted : C.muted,
    align: 'right', valign: 'middle', margin: 0
  });
}

function addSlideHeading(slide, title, subtitle, isDark = false) {
  slide.addText(title, {
    x: 0.8, y: 0.94, w: 11.7, h: 0.52,
    fontSize: 24, fontFace: 'Georgia', bold: true,
    color: isDark ? C.darkText : C.ink,
    valign: 'top', margin: 0
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8, y: 1.5, w: 11.7, h: 0.32,
      fontSize: 12.5, fontFace: 'Calibri',
      color: isDark ? C.darkTextSoft : C.inkSoft,
      valign: 'top', margin: 0
    });
  }
}

function addBentoCard(slide, x, y, w, h, isDark = false) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.18,
    fill: { color: isDark ? C.darkCard : C.cardBg },
    line: { color: isDark ? C.darkCardBorder : C.cardBorder, width: 1 }
  });
}

// ==========================================
// SLIDE 1: COVER (DARK THEME)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.darkBg };

  addBentoCard(slide, 0.8, 0.7, 11.733, 6.1, true);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.3, y: 1.15, w: 3.8, h: 0.36,
    rectRadius: 0.18,
    fill: { color: '1C382B' },
    line: { color: '2E5B45', width: 1 }
  });
  slide.addText('ENGINEER PORTFOLIO & EXECUTIVE PRESENTATION · 2026', {
    x: 1.3, y: 1.15, w: 3.8, h: 0.36,
    fontSize: 8.5, fontFace: 'Calibri', bold: true,
    color: '6EE7B7', align: 'center', valign: 'middle', margin: 0
  });

  slide.addText('Reiky Aryanando Pratama', {
    x: 1.3, y: 1.7, w: 7.2, h: 0.9,
    fontSize: 38, fontFace: 'Georgia', bold: true,
    color: C.white, valign: 'middle', margin: 0
  });

  slide.addText('Junior Backend & Full-Stack Developer · REST APIs · Web & Mobile', {
    x: 1.3, y: 2.65, w: 7.2, h: 0.45,
    fontSize: 16, fontFace: 'Calibri', bold: true,
    color: C.mint, valign: 'top', margin: 0
  });

  slide.addText(
    'Informatics graduate (GPA 3.81 / 4.00) with ~11 months internship experience as a Backend Developer at Badan Sistem Informasi Universitas Islam Indonesia. ' +
    'Focused on developing reliable, structured REST APIs with PHP, Laravel, and Lumen, database schema & ERD design, Postman testing, and AI-powered MCP services.',
    {
      x: 1.3, y: 3.25, w: 6.8, h: 1.2,
      fontSize: 13, fontFace: 'Calibri',
      color: C.darkTextSoft, lineSpacingMultiple: 1.2, margin: 0
    }
  );

  const contactPills = [
    { label: 'EMAIL', val: 'reikyranp@gmail.com' },
    { label: 'LOCATION', val: 'Yogyakarta, Indonesia (WIB)' },
    { label: 'PORTFOLIO', val: 'https://reiky03.github.io' }
  ];
  contactPills.forEach((p, idx) => {
    const px = 1.3 + (idx * 2.3);
    slide.addShape(pres.ShapeType.roundRect, {
      x: px, y: 4.75, w: 2.15, h: 0.72,
      rectRadius: 0.12,
      fill: { color: '182E22' },
      line: { color: '284B38', width: 1 }
    });
    slide.addText(p.label, {
      x: px + 0.12, y: 4.82, w: 1.9, h: 0.22,
      fontSize: 7.5, fontFace: 'Calibri', bold: true,
      color: '6EE7B7', margin: 0
    });
    slide.addText(p.val, {
      x: px + 0.12, y: 5.06, w: 1.9, h: 0.32,
      fontSize: 9.5, fontFace: 'Calibri', bold: true,
      color: C.white, margin: 0
    });
  });

  const metricBoxX = 8.6;
  slide.addShape(pres.ShapeType.roundRect, {
    x: metricBoxX, y: 1.6, w: 3.4, h: 4.4,
    rectRadius: 0.2,
    fill: { color: '102018' },
    line: { color: '244533', width: 1 }
  });

  const metrics = [
    { num: '3.81', unit: '/ 4.00', label: 'Bachelor of Informatics GPA', sub: 'Universitas Islam Indonesia' },
    { num: '05+', unit: 'Systems', label: 'Production & Thesis Deliveries', sub: 'Backend, Mobile & IoT Architectures' },
    { num: 'AWS & Cisco', unit: '', label: 'Industry Certifications', sub: 'Cloud re/Start & Cyber Threat Mgmt' }
  ];

  metrics.forEach((m, idx) => {
    const my = 1.9 + (idx * 1.35);
    slide.addText([
      { text: m.num, options: { fontSize: 24, fontFace: 'Georgia', bold: true, color: '6EE7B7' } },
      { text: ' ' + m.unit, options: { fontSize: 13, fontFace: 'Calibri', bold: true, color: C.darkTextSoft } }
    ], { x: metricBoxX + 0.3, y: my, w: 2.8, h: 0.45, margin: 0 });
    
    slide.addText(m.label, {
      x: metricBoxX + 0.3, y: my + 0.42, w: 2.8, h: 0.25,
      fontSize: 10, fontFace: 'Calibri', bold: true, color: C.white, margin: 0
    });
    slide.addText(m.sub, {
      x: metricBoxX + 0.3, y: my + 0.65, w: 2.8, h: 0.25,
      fontSize: 8.5, fontFace: 'Calibri', color: C.darkMuted, margin: 0
    });
  });

  slide.addText('Handcrafted with discipline · reiky03.github.io · Confidential & Curated', {
    x: 1.3, y: 6.35, w: 10.7, h: 0.3,
    fontSize: 8.5, fontFace: 'Calibri', color: C.darkMuted, margin: 0
  });

  slide.addNotes('Cover slide introducing Reiky Aryanando Pratama as Backend & Full-Stack Developer with current internship at BSI UII.');
}

// ==========================================
// SLIDE 2: EXECUTIVE PROFILE & IDENTITY
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.paperBg };
  addTopNav(slide, '01 · Professional Profile', '02 / 11');
  addSlideHeading(slide, 'Beyond the Code: Systems, Craft & Precision', 'A blend of strong academic grounding, rigorous software engineering, and active production delivery.');

  addBentoCard(slide, 0.8, 2.05, 5.7, 4.85);
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.15, y: 2.3, w: 2.4, h: 0.28,
    rectRadius: 0.14, fill: { color: C.emeraldLight }, line: { color: 'C2E5CD', width: 1 }
  });
  slide.addText('ENGINEERING CORE', {
    x: 1.15, y: 2.3, w: 2.4, h: 0.28,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.emerald, align: 'center', valign: 'middle', margin: 0
  });

  slide.addText('Building Practical & Reliable Software', {
    x: 1.15, y: 2.7, w: 5.0, h: 0.45,
    fontSize: 18, fontFace: 'Georgia', bold: true, color: C.ink, margin: 0
  });

  slide.addText(
    'I believe that good software starts with clear fundamentals, solid data integrity, and thoughtful design. ' +
    'My journey spans foundational engineering: from organizing normalized database schemas and clean REST APIs to building responsive client interfaces.\n\n' +
    'Through my internship at Badan Sistem Informasi UII and academic research, I stay curious, open to feedback, and dedicated to writing maintainable code that helps real users.',
    {
      x: 1.15, y: 3.25, w: 5.0, h: 1.9,
      fontSize: 11.5, fontFace: 'Calibri', color: C.inkSoft, lineSpacingMultiple: 1.25, margin: 0
    }
  );

  const pillars = [
    { title: 'Reliability-First', desc: 'Normalized schemas, idempotent transactions, and defensive error boundaries.' },
    { title: 'Full-Stack Agility', desc: 'Seamless bridge between server-side Go/PHP and client-side TypeScript/Flutter.' },
    { title: 'Academic Rigor', desc: 'GPA 3.81/4.00, published thesis research, and certified cloud practices.' }
  ];
  pillars.forEach((pil, idx) => {
    const py = 5.3 + (idx * 0.48);
    slide.addText([
      { text: '•  ' + pil.title + ' — ', options: { bold: true, color: C.emerald, fontSize: 10 } },
      { text: pil.desc, options: { color: C.muted, fontSize: 9.5 } }
    ], { x: 1.15, y: py, w: 5.0, h: 0.38, margin: 0 });
  });

  addBentoCard(slide, 6.75, 2.05, 5.78, 2.3);
  slide.addText('CURRENT PRODUCTION ROLE · SINCE DEC 2025', {
    x: 7.05, y: 2.25, w: 4.5, h: 0.25,
    fontSize: 8.5, fontFace: 'Calibri', bold: true, color: C.emerald, margin: 0
  });
  slide.addText('Backend Developer Intern', {
    x: 7.05, y: 2.52, w: 5.1, h: 0.35,
    fontSize: 16, fontFace: 'Georgia', bold: true, color: C.ink, margin: 0
  });
  slide.addText('Badan Sistem Informasi · Universitas Islam Indonesia', {
    x: 7.05, y: 2.88, w: 5.1, h: 0.25,
    fontSize: 10.5, fontFace: 'Calibri', bold: true, color: C.muted, margin: 0
  });
  slide.addText(
    '• Developing RESTful APIs with PHP, Laravel, & Lumen for university internal systems.\n' +
    '• Designing database schemas, ERDs, and running API test suites via Postman.\n' +
    '• Integrating backend with frontend (Angular) and collaborating via Git & GitLab.\n' +
    '• Implementing Model Context Protocol (MCP) & AI for automated summaries & chat.',
    {
      x: 7.05, y: 3.18, w: 5.2, h: 1.05,
      fontSize: 9.5, fontFace: 'Calibri', color: C.inkSoft, lineSpacingMultiple: 1.25, margin: 0
    }
  );

  addBentoCard(slide, 6.75, 4.6, 5.78, 2.3);
  slide.addText('ACADEMIC EXCELLENCE & PUBLISHED RESEARCH', {
    x: 7.05, y: 4.8, w: 4.5, h: 0.25,
    fontSize: 8.5, fontFace: 'Calibri', bold: true, color: C.emerald, margin: 0
  });
  slide.addText('Bachelor of Informatics (GPA 3.81 / 4.00)', {
    x: 7.05, y: 5.05, w: 5.1, h: 0.35,
    fontSize: 15, fontFace: 'Georgia', bold: true, color: C.ink, margin: 0
  });
  slide.addText('Universitas Islam Indonesia · Class of 2026', {
    x: 7.05, y: 5.4, w: 5.1, h: 0.25,
    fontSize: 10.5, fontFace: 'Calibri', bold: true, color: C.muted, margin: 0
  });
  slide.addText(
    '• Published Researcher: Park Masjid thesis published in Technologia: Jurnal Ilmiah (2026).\n' +
    '• Award Winner: Best Team Award at Informatics Expo Design Thinking (2022).\n' +
    '• Certified: AWS re/Start Cloud Architecture & Cisco Cyber Threat Management.',
    {
      x: 7.05, y: 5.7, w: 5.2, h: 1.0,
      fontSize: 10, fontFace: 'Calibri', color: C.inkSoft, lineSpacingMultiple: 1.25, margin: 0
    }
  );

  slide.addNotes('Professional background highlighting education, GPA 3.81, role at Badan Sistem Informasi UII, and published research.');
}

// ==========================================
// SLIDE 3: TECHNICAL TOOLKIT & ARCHITECTURE
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.paperBg };
  addTopNav(slide, '02 · Technical Toolkit', '03 / 11');
  addSlideHeading(slide, 'What I Build With: A Focused Engineering Stack', 'Refined through production backend internships, academic research, and full-stack software delivery.');

  const categories = [
    {
      num: '01',
      title: 'Backend & Systems',
      summary: 'Backend services, RESTful API endpoints, and clean server-side application logic.',
      chips: ['PHP & Laravel', 'Lumen Microservices', 'Go (Golang)', 'RESTful APIs', 'gRPC & Protobuf', 'MCP AI Protocol', 'RBAC Security']
    },
    {
      num: '02',
      title: 'Web & Interfaces',
      summary: 'Interactive, accessible, and fast web applications with crisp design systems and zero layout thrash.',
      chips: ['TypeScript', 'React & Next.js', 'Vue.js 3 & Vite', 'Tailwind CSS', 'HTML5 / Modern CSS', 'GSAP Animation', 'Component Systems']
    },
    {
      num: '03',
      title: 'Mobile Engineering',
      summary: 'Native and cross-platform mobile apps with fluid animations, offline caches, and hardware integrations.',
      chips: ['Flutter & Dart', 'Riverpod State Mgmt', 'Kotlin (Android Native)', 'Jetpack Compose', 'React Native & Expo', 'SQLite / AsyncStorage', 'Hardware Sensors']
    },
    {
      num: '04',
      title: 'Data & Infrastructure',
      summary: 'Normalized data models, real-time database synchronizations, and containerized deployment pipelines.',
      chips: ['PostgreSQL', 'MySQL Tuning', 'Redis In-Memory Cache', 'Firebase Firestore', 'Docker Containers', 'AWS Cloud Services', 'Git CI/CD Workflows']
    }
  ];

  categories.forEach((cat, idx) => {
    const cx = 0.8 + (idx * 2.98);
    const cardW = 2.82;
    addBentoCard(slide, cx, 2.05, cardW, 4.88);

    slide.addText(cat.num, {
      x: cx + 0.22, y: 2.22, w: 0.6, h: 0.28,
      fontSize: 16, fontFace: 'Georgia', bold: true, color: C.emerald, margin: 0
    });

    slide.addText(cat.title, {
      x: cx + 0.22, y: 2.55, w: cardW - 0.44, h: 0.42,
      fontSize: 13.5, fontFace: 'Georgia', bold: true, color: C.ink, margin: 0
    });

    slide.addText(cat.summary, {
      x: cx + 0.22, y: 3.02, w: cardW - 0.44, h: 0.72,
      fontSize: 9.5, fontFace: 'Calibri', color: C.inkSoft, lineSpacingMultiple: 1.15, margin: 0
    });

    slide.addShape(pres.ShapeType.line, {
      x: cx + 0.22, y: 3.82, w: cardW - 0.44, h: 0,
      line: { color: C.cardBorder, width: 1 }
    });

    slide.addText('CORE COMPETENCIES', {
      x: cx + 0.22, y: 3.98, w: cardW - 0.44, h: 0.2,
      fontSize: 7.5, fontFace: 'Calibri', bold: true, color: C.muted, margin: 0
    });

    let currentY = 4.25;
    cat.chips.forEach(chip => {
      slide.addShape(pres.ShapeType.roundRect, {
        x: cx + 0.22, y: currentY, w: cardW - 0.44, h: 0.24,
        rectRadius: 0.12,
        fill: { color: 'F4F2E9' },
        line: { color: 'E2DEC9', width: 1 }
      });
      slide.addText(chip, {
        x: cx + 0.32, y: currentY, w: cardW - 0.64, h: 0.24,
        fontSize: 8.5, fontFace: 'Calibri', bold: true, color: C.ink,
        valign: 'middle', margin: 0
      });
      currentY += 0.29;
    });
  });

  slide.addNotes('Overview of technical competencies organized into Backend, Web Interfaces, Mobile Engineering, and Data/Cloud Infrastructure.');
}

// ==========================================
// SLIDE 4: CASE STUDY 01 — OPSFLOW
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.paperBg };
  addTopNav(slide, '03 · Case Study 01 / Platform', '04 / 11');
  addSlideHeading(slide, 'OpsFlow: Enterprise Service Desk & Asset Control', 'Make internal IT work visible, assignable, and auditable from initial request to resolution.');

  addBentoCard(slide, 0.8, 2.05, 4.8, 4.85);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.1, y: 2.3, w: 2.5, h: 0.28,
    rectRadius: 0.14, fill: { color: C.emeraldLight }, line: { color: 'C2E5CD', width: 1 }
  });
  slide.addText('SERVICE DESK / WEB PLATFORM', {
    x: 1.1, y: 2.3, w: 2.5, h: 0.28,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.emerald, align: 'center', valign: 'middle', margin: 0
  });

  slide.addText('OpsFlow Platform', {
    x: 1.1, y: 2.7, w: 4.2, h: 0.45,
    fontSize: 20, fontFace: 'Georgia', bold: true, color: C.ink, margin: 0
  });

  slide.addText(
    'A full-featured internal operations and service desk platform built to eliminate lost tickets and opaque IT requests. ' +
    'Engineered with multi-role access controls, automated technician handoffs, audit histories, and asset allocation tracking.',
    {
      x: 1.1, y: 3.25, w: 4.2, h: 1.1,
      fontSize: 11, fontFace: 'Calibri', color: C.inkSoft, lineSpacingMultiple: 1.25, margin: 0
    }
  );

  slide.addText('KEY ARCHITECTURAL HIGHLIGHTS', {
    x: 1.1, y: 4.45, w: 4.2, h: 0.22,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.muted, margin: 0
  });

  const highlights = [
    { title: 'Role-Based Access Control', desc: 'Strict separation for Admins, Technicians, and Department Requesters.' },
    { title: 'Ticket Lifecycle & SLAs', desc: 'Real-time status transitions with automated escalation and notifications.' },
    { title: 'Asset Tracking & Audit Log', desc: 'Immutable operational history for hardware, licenses, and assignments.' }
  ];
  highlights.forEach((h, idx) => {
    slide.addText([
      { text: '•  ' + h.title + ': ', options: { bold: true, color: C.emerald, fontSize: 9.5 } },
      { text: h.desc, options: { color: C.inkSoft, fontSize: 9 } }
    ], { x: 1.1, y: 4.75 + (idx * 0.48), w: 4.2, h: 0.42, margin: 0 });
  });

  slide.addText('TECH STACK: Laravel  ·  React  ·  TypeScript  ·  PostgreSQL  ·  Docker', {
    x: 1.1, y: 6.35, w: 4.2, h: 0.3,
    fontSize: 8.5, fontFace: 'Calibri', bold: true, color: C.emerald, margin: 0
  });

  // Right Side Visuals
  const imgX = 5.85;
  addBentoCard(slide, imgX, 2.05, 6.68, 4.85);

  slide.addShape(pres.ShapeType.rect, {
    x: imgX + 0.35, y: 2.25, w: 5.98, h: 3.0,
    fill: { color: 'F1F5F9' },
    line: { color: C.cardBorder, width: 1 }
  });
  slide.addImage({
    path: imgPath('opsflow.png'),
    x: imgX + 0.35, y: 2.25, w: 5.98, h: 3.0
  });
  slide.addText('OpsFlow Operations Dashboard: Real-time ticket queues, SLA metrics & status breakdown', {
    x: imgX + 0.35, y: 5.32, w: 5.98, h: 0.22,
    fontSize: 8.5, fontFace: 'Calibri', color: C.muted, italic: true, margin: 0
  });

  slide.addShape(pres.ShapeType.rect, {
    x: imgX + 0.35, y: 5.62, w: 5.98, h: 1.05,
    fill: { color: 'F1F5F9' },
    line: { color: C.cardBorder, width: 1 }
  });
  slide.addImage({
    path: imgPath('opsflow-detail.png'),
    x: imgX + 0.35, y: 5.62, w: 5.98, h: 1.05
  });

  slide.addNotes('Case study on OpsFlow: internal IT service desk platform with Laravel, React, TypeScript, and PostgreSQL.');
}

// ==========================================
// SLIDE 5: CASE STUDY 02 — KIZEN
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.paperBg };
  addTopNav(slide, '04 · Case Study 02 / Mobile & Cloud', '05 / 11');
  addSlideHeading(slide, 'Kizen: Manga & Comic Reader with Cloud Sync', 'A personal comic reader app built with Flutter, Riverpod, and multi-source cloud sync.');

  addBentoCard(slide, 0.8, 2.05, 4.8, 4.85);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.1, y: 2.3, w: 2.6, h: 0.28,
    rectRadius: 0.14, fill: { color: C.emeraldLight }, line: { color: 'C2E5CD', width: 1 }
  });
  slide.addText('MOBILE & CLOUD / FLUTTER', {
    x: 1.1, y: 2.3, w: 2.6, h: 0.28,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.emerald, align: 'center', valign: 'middle', margin: 0
  });

  slide.addText('Kizen Application', {
    x: 1.1, y: 2.7, w: 4.2, h: 0.45,
    fontSize: 20, fontFace: 'Georgia', bold: true, color: C.ink, margin: 0
  });

  slide.addText(
    'A cross-platform manga and comic reader application delivering a clean and lightweight reading experience. ' +
    'Engineered with Riverpod reactive state management, Tachiyomi-inspired library organization, and multi-source scraping architecture.',
    {
      x: 1.1, y: 3.25, w: 4.2, h: 1.1,
      fontSize: 11, fontFace: 'Calibri', color: C.inkSoft, lineSpacingMultiple: 1.25, margin: 0
    }
  );

  slide.addText('CORE CAPABILITIES & ENGINEERING', {
    x: 1.1, y: 4.45, w: 4.2, h: 0.22,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.muted, margin: 0
  });

  const highlights = [
    { title: 'Multi-Source Scrapers', desc: 'Modular extension architecture for fetching chapters dynamically.' },
    { title: 'Cloud Sync & Progress', desc: 'Firebase Firestore syncing reading history across multiple devices.' },
    { title: 'Infinite Scroll Engine', desc: 'Preloaded image pipeline with zero stutter and memory-conscious caching.' }
  ];
  highlights.forEach((h, idx) => {
    slide.addText([
      { text: '•  ' + h.title + ': ', options: { bold: true, color: C.emerald, fontSize: 9.5 } },
      { text: h.desc, options: { color: C.inkSoft, fontSize: 9 } }
    ], { x: 1.1, y: 4.75 + (idx * 0.48), w: 4.2, h: 0.42, margin: 0 });
  });

  slide.addText('TECH STACK: Flutter  ·  Dart  ·  Riverpod  ·  Firebase  ·  Firestore', {
    x: 1.1, y: 6.35, w: 4.2, h: 0.3,
    fontSize: 8.5, fontFace: 'Calibri', bold: true, color: C.emerald, margin: 0
  });

  // Right Side 3 Mobile Screens
  const imgX = 5.85;
  addBentoCard(slide, imgX, 2.05, 6.68, 4.85);

  const screens = [
    { file: 'kizen-welcome.png', label: 'Cloud Sync Onboarding' },
    { file: 'comic-library.png', label: 'Library & Collections' },
    { file: 'comic-reader.png', label: 'High-Res Infinite Reader' }
  ];
  screens.forEach((sc, idx) => {
    const sx = imgX + 0.32 + (idx * 2.08);
    slide.addShape(pres.ShapeType.roundRect, {
      x: sx - 0.05, y: 2.22, w: 1.95, h: 4.12,
      rectRadius: 0.08,
      fill: { color: '0F172A' },
      line: { color: '334155', width: 1.5 }
    });
    slide.addImage({
      path: imgPath(sc.file),
      x: sx, y: 2.27, w: 1.85, h: 4.02
    });
    slide.addText(sc.label, {
      x: sx, y: 6.42, w: 1.85, h: 0.28,
      fontSize: 8.5, fontFace: 'Calibri', color: C.muted, align: 'center', bold: true, margin: 0
    });
  });

  slide.addNotes('Case study on Kizen: Flutter manga reader app with Riverpod state management and Firebase synchronization.');
}

// ==========================================
// SLIDE 6: CASE STUDY 03 — PARK MASJID
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.paperBg };
  addTopNav(slide, '05 · Case Study 03 / Thesis & IoT', '06 / 11');
  addSlideHeading(slide, 'Park Masjid: IoT-Integrated Smart Mosque Parking', 'Hardware-integrated vehicle counter with realtime Firebase sync and prayer schedule automation.');

  addBentoCard(slide, 0.8, 2.05, 4.8, 4.85);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.1, y: 2.3, w: 2.8, h: 0.28,
    rectRadius: 0.14, fill: { color: C.emeraldLight }, line: { color: 'C2E5CD', width: 1 }
  });
  slide.addText('UNDERGRADUATE THESIS RESEARCH', {
    x: 1.1, y: 2.3, w: 2.8, h: 0.28,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.emerald, align: 'center', valign: 'middle', margin: 0
  });

  slide.addText('Park Masjid Platform', {
    x: 1.1, y: 2.7, w: 4.2, h: 0.45,
    fontSize: 20, fontFace: 'Georgia', bold: true, color: C.ink, margin: 0
  });

  slide.addText(
    'An Android and IoT thesis system engineered to eliminate parking congestion at major congregational mosques. ' +
    'Directly connects gate sensors to Firebase Realtime Database to broadcast live parking availability to thousands of worshippers.\n\n' +
    'Published as academic research in Technologia: Jurnal Ilmiah (2026).',
    {
      x: 1.1, y: 3.25, w: 4.2, h: 1.25,
      fontSize: 10.5, fontFace: 'Calibri', color: C.inkSoft, lineSpacingMultiple: 1.25, margin: 0
    }
  );

  slide.addText('KEY INNOVATIONS & ACHIEVEMENTS', {
    x: 1.1, y: 4.6, w: 4.2, h: 0.22,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.muted, margin: 0
  });

  const highlights = [
    { title: 'Live Vehicle Counters', desc: 'Realtime updates for motorcycle and car parking slots via IoT sensors.' },
    { title: 'Administrator Control', desc: 'Live capacity overrides, security controls, and prayer schedule editor.' },
    { title: 'Published Research', desc: 'Peer-reviewed academic paper verifying hardware-to-app latency.' }
  ];
  highlights.forEach((h, idx) => {
    slide.addText([
      { text: '•  ' + h.title + ': ', options: { bold: true, color: C.emerald, fontSize: 9.5 } },
      { text: h.desc, options: { color: C.inkSoft, fontSize: 9 } }
    ], { x: 1.1, y: 4.88 + (idx * 0.46), w: 4.2, h: 0.42, margin: 0 });
  });

  slide.addText('TECH STACK: Kotlin  ·  Android SDK  ·  Firebase Realtime DB  ·  IoT  ·  Material 3', {
    x: 1.1, y: 6.35, w: 4.2, h: 0.3,
    fontSize: 8.5, fontFace: 'Calibri', bold: true, color: C.emerald, margin: 0
  });

  // Right Side Screens
  const imgX = 5.85;
  addBentoCard(slide, imgX, 2.05, 6.68, 4.85);

  slide.addShape(pres.ShapeType.roundRect, {
    x: imgX + 0.35, y: 2.22, w: 2.05, h: 4.12,
    rectRadius: 0.08, fill: { color: '0F172A' }, line: { color: '334155', width: 1.5 }
  });
  slide.addImage({
    path: imgPath('park-masjid-app.png'),
    x: imgX + 0.4, y: 2.27, w: 1.95, h: 4.02
  });
  slide.addText('Visitor Live Slot Counter', {
    x: imgX + 0.35, y: 6.42, w: 2.05, h: 0.28,
    fontSize: 8.5, fontFace: 'Calibri', color: C.muted, align: 'center', bold: true, margin: 0
  });

  slide.addShape(pres.ShapeType.rect, {
    x: imgX + 2.65, y: 2.22, w: 3.65, h: 4.12,
    fill: { color: 'F8FAFC' }, line: { color: C.cardBorder, width: 1.5 }
  });
  slide.addImage({
    path: imgPath('park-masjid-admin.png'),
    x: imgX + 2.7, y: 2.27, w: 3.55, h: 4.02
  });
  slide.addText('Administrator Capacity & Schedule Editor', {
    x: imgX + 2.65, y: 6.42, w: 3.65, h: 0.28,
    fontSize: 8.5, fontFace: 'Calibri', color: C.muted, align: 'center', bold: true, margin: 0
  });

  slide.addNotes('Case study on Park Masjid: IoT vehicle counter and Android app thesis published in Technologia Jurnal Ilmiah.');
}

// ==========================================
// SLIDE 7: CASE STUDY 04 — ORDERFORGE & KOMIK
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.paperBg };
  addTopNav(slide, '06 · Case Study 04 / Reliability & Architecture', '07 / 11');
  addSlideHeading(slide, 'OrderForge & Native Android Architecture', 'Explorations in e-commerce checkout consistency and clean native mobile architecture.');

  // Left Bento Card: OrderForge
  addBentoCard(slide, 0.8, 2.05, 5.7, 4.85);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.15, y: 2.3, w: 2.5, h: 0.28,
    rectRadius: 0.14, fill: { color: C.emeraldLight }, line: { color: 'C2E5CD', width: 1 }
  });
  slide.addText('COMMERCE & RELIABILITY', {
    x: 1.15, y: 2.3, w: 2.5, h: 0.28,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.emerald, align: 'center', valign: 'middle', margin: 0
  });

  slide.addText('OrderForge Checkout Engine', {
    x: 1.15, y: 2.7, w: 5.0, h: 0.42,
    fontSize: 17, fontFace: 'Georgia', bold: true, color: C.ink, margin: 0
  });

  slide.addText(
    'An e-commerce order engine designed to explore data consistency during checkout surges with atomic Redis locks and idempotent payment processing.',
    {
      x: 1.15, y: 3.18, w: 5.0, h: 0.72,
      fontSize: 10, fontFace: 'Calibri', color: C.inkSoft, lineSpacingMultiple: 1.2, margin: 0
    }
  );

  slide.addShape(pres.ShapeType.rect, {
    x: 1.15, y: 3.96, w: 5.0, h: 1.85,
    fill: { color: 'F1F5F9' }, line: { color: C.cardBorder, width: 1 }
  });
  slide.addImage({
    path: imgPath('orderforge.png'),
    x: 1.15, y: 3.96, w: 5.0, h: 1.85
  });

  const ofPoints = [
    '• Atomic Redis reservation locks preventing overselling.',
    '• Cryptographic webhook deduplication preventing double-charges.'
  ];
  ofPoints.forEach((p, idx) => {
    slide.addText(p, {
      x: 1.15, y: 5.88 + (idx * 0.24), w: 5.0, h: 0.22,
      fontSize: 8.5, fontFace: 'Calibri', color: C.inkSoft, margin: 0
    });
  });

  slide.addText('TECH STACK: Laravel  ·  Next.js  ·  PostgreSQL  ·  Docker  ·  Redis', {
    x: 1.15, y: 6.42, w: 5.0, h: 0.25,
    fontSize: 8.5, fontFace: 'Calibri', bold: true, color: C.emerald, margin: 0
  });

  // Right Bento Card: Katalog Komik
  addBentoCard(slide, 6.75, 2.05, 5.78, 4.85);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 7.1, y: 2.3, w: 2.6, h: 0.28,
    rectRadius: 0.14, fill: { color: C.emeraldLight }, line: { color: 'C2E5CD', width: 1 }
  });
  slide.addText('NATIVE ANDROID / OFFLINE-FIRST', {
    x: 7.1, y: 2.3, w: 2.6, h: 0.28,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.emerald, align: 'center', valign: 'middle', margin: 0
  });

  slide.addText('Katalog Komik Android App', {
    x: 7.1, y: 2.7, w: 5.0, h: 0.42,
    fontSize: 17, fontFace: 'Georgia', bold: true, color: C.ink, margin: 0
  });

  slide.addText(
    'A modern native Android application showcasing Google Clean Architecture, declarative Jetpack Compose UI, and offline-first Room Database caching.',
    {
      x: 7.1, y: 3.18, w: 5.0, h: 0.72,
      fontSize: 10, fontFace: 'Calibri', color: C.inkSoft, lineSpacingMultiple: 1.2, margin: 0
    }
  );

  slide.addShape(pres.ShapeType.roundRect, {
    x: 7.1, y: 3.96, w: 5.0, h: 1.85,
    rectRadius: 0.08, fill: { color: '0F172A' }, line: { color: '334155', width: 1 }
  });
  slide.addImage({
    path: imgPath('comic-library.png'),
    x: 7.15, y: 4.01, w: 4.9, h: 1.75
  });

  const komikPoints = [
    '• 100% declarative Jetpack Compose UI with adaptive orientations.',
    '• Reactive Single Source of Truth repository with Room DB & Coroutines.'
  ];
  komikPoints.forEach((p, idx) => {
    slide.addText(p, {
      x: 7.1, y: 5.88 + (idx * 0.24), w: 5.0, h: 0.22,
      fontSize: 8.5, fontFace: 'Calibri', color: C.inkSoft, margin: 0
    });
  });

  slide.addText('TECH STACK: Kotlin  ·  Jetpack Compose  ·  Room DB  ·  Retrofit  ·  Coroutines', {
    x: 7.1, y: 6.42, w: 5.0, h: 0.25,
    fontSize: 8.5, fontFace: 'Calibri', bold: true, color: C.emerald, margin: 0
  });

  slide.addNotes('Dual case study presenting OrderForge commerce reliability engine and Katalog Komik native Android app.');
}

// ==========================================
// SLIDE 8: CASE STUDY 05 — MONEYTRACK
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.paperBg };
  addTopNav(slide, '07 · Case Study 05 / Personal Finance', '08 / 11');
  addSlideHeading(slide, 'MoneyTrack: Offline-First Expense & Cash Flow Analytics', 'Know where every rupiah moves — zero cloud latency, multi-wallet accounts, and complete privacy.');

  addBentoCard(slide, 0.8, 2.05, 4.8, 4.85);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.1, y: 2.3, w: 2.7, h: 0.28,
    rectRadius: 0.14, fill: { color: C.emeraldLight }, line: { color: 'C2E5CD', width: 1 }
  });
  slide.addText('MOBILE FINANCE & ANALYTICS', {
    x: 1.1, y: 2.3, w: 2.7, h: 0.28,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.emerald, align: 'center', valign: 'middle', margin: 0
  });

  slide.addText('MoneyTrack Mobile App', {
    x: 1.1, y: 2.7, w: 4.2, h: 0.45,
    fontSize: 20, fontFace: 'Georgia', bold: true, color: C.ink, margin: 0
  });

  slide.addText(
    'A personal finance management application engineered for speed, privacy, and full offline functionality. ' +
    'Enables users to manage multiple bank accounts, e-wallets, and cash reserves with automated expense categorization and visual analytics.',
    {
      x: 1.1, y: 3.25, w: 4.2, h: 1.1,
      fontSize: 11, fontFace: 'Calibri', color: C.inkSoft, lineSpacingMultiple: 1.25, margin: 0
    }
  );

  slide.addText('CORE PRODUCT HIGHLIGHTS', {
    x: 1.1, y: 4.45, w: 4.2, h: 0.22,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.muted, margin: 0
  });

  const highlights = [
    { title: '100% Offline Storage', desc: 'Encrypted local device storage with zero server dependency or network delay.' },
    { title: 'Multi-Wallet Accounting', desc: 'Seamless inter-wallet transfers with atomic debit/credit transaction logging.' },
    { title: 'Dynamic Cash-Flow Charts', desc: 'Realtime visual breakdowns of monthly income, expenditures, and categories.' }
  ];
  highlights.forEach((h, idx) => {
    slide.addText([
      { text: '•  ' + h.title + ': ', options: { bold: true, color: C.emerald, fontSize: 9.5 } },
      { text: h.desc, options: { color: C.inkSoft, fontSize: 9 } }
    ], { x: 1.1, y: 4.75 + (idx * 0.48), w: 4.2, h: 0.42, margin: 0 });
  });

  slide.addText('TECH STACK: React Native  ·  Expo  ·  TypeScript  ·  AsyncStorage  ·  Charts', {
    x: 1.1, y: 6.35, w: 4.2, h: 0.3,
    fontSize: 8.5, fontFace: 'Calibri', bold: true, color: C.emerald, margin: 0
  });

  // Right Side Mobile Screens
  const imgX = 5.85;
  addBentoCard(slide, imgX, 2.05, 6.68, 4.85);

  slide.addShape(pres.ShapeType.roundRect, {
    x: imgX + 0.65, y: 2.22, w: 2.45, h: 4.12,
    rectRadius: 0.08, fill: { color: '0F172A' }, line: { color: '334155', width: 1.5 }
  });
  slide.addImage({
    path: imgPath('moneytrack-dashboard.png'),
    x: imgX + 0.7, y: 2.27, w: 2.35, h: 4.02
  });
  slide.addText('Balance & Wallet Breakdown', {
    x: imgX + 0.65, y: 6.42, w: 2.45, h: 0.28,
    fontSize: 8.5, fontFace: 'Calibri', color: C.muted, align: 'center', bold: true, margin: 0
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: imgX + 3.55, y: 2.22, w: 2.45, h: 4.12,
    rectRadius: 0.08, fill: { color: '0F172A' }, line: { color: '334155', width: 1.5 }
  });
  slide.addImage({
    path: imgPath('moneytrack-transactions.png'),
    x: imgX + 3.6, y: 2.27, w: 2.35, h: 4.02
  });
  slide.addText('Filterable Transaction Ledger', {
    x: imgX + 3.55, y: 6.42, w: 2.45, h: 0.28,
    fontSize: 8.5, fontFace: 'Calibri', color: C.muted, align: 'center', bold: true, margin: 0
  });

  slide.addNotes('Case study on MoneyTrack: offline-first personal finance application with React Native, Expo, and TypeScript.');
}

// ==========================================
// SLIDE 9: SUPPLEMENTARY ARCHIVE
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.paperBg };
  addTopNav(slide, '08 · Supplementary Archive', '09 / 11');
  addSlideHeading(slide, 'Also in the Making: Health Tech & Enterprise Deliveries', 'Additional explorations and production client deliverables from research and freelance projects.');

  addBentoCard(slide, 0.8, 2.05, 5.7, 4.85);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.15, y: 2.3, w: 2.6, h: 0.28,
    rectRadius: 0.14, fill: { color: C.emeraldLight }, line: { color: 'C2E5CD', width: 1 }
  });
  slide.addText('HEALTH & WELLNESS · ANDROID', {
    x: 1.15, y: 2.3, w: 2.6, h: 0.28,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.emerald, align: 'center', valign: 'middle', margin: 0
  });

  slide.addText('JiwaKu Mental Health App', {
    x: 1.15, y: 2.65, w: 3.2, h: 0.55,
    fontSize: 16.5, fontFace: 'Georgia', bold: true, color: C.ink, margin: 0
  });

  slide.addText(
    'A comprehensive mental wellness support app built with Kotlin, featuring real-time counseling chat, emergency psychiatric helpline routing, guided audio meditation, and Firebase Firestore authentication.',
    {
      x: 1.15, y: 3.25, w: 3.1, h: 1.25,
      fontSize: 10.5, fontFace: 'Calibri', color: C.inkSoft, lineSpacingMultiple: 1.25, margin: 0
    }
  );

  slide.addShape(pres.ShapeType.roundRect, {
    x: 4.45, y: 2.85, w: 1.8, h: 3.45,
    rectRadius: 0.08, fill: { color: '0F172A' }, line: { color: '334155', width: 1 }
  });
  slide.addImage({
    path: imgPath('jiwaku.png'),
    x: 4.5, y: 2.9, w: 1.7, h: 3.35
  });

  const jwFeatures = [
    '• Real-time counseling chat with Firestore listeners.',
    '• Direct routing to certified psychiatric helplines.',
    '• Built-in mood tracking journal and guided audio exercises.'
  ];
  jwFeatures.forEach((jf, idx) => {
    slide.addText(jf, {
      x: 1.15, y: 4.65 + (idx * 0.45), w: 3.1, h: 0.4,
      fontSize: 9, fontFace: 'Calibri', color: C.inkSoft, margin: 0
    });
  });

  slide.addText('TECH STACK: Kotlin  ·  Android SDK  ·  Firebase  ·  Material 3', {
    x: 1.15, y: 6.35, w: 5.0, h: 0.3,
    fontSize: 8.5, fontFace: 'Calibri', bold: true, color: C.emerald, margin: 0
  });

  addBentoCard(slide, 6.75, 2.05, 5.78, 4.85);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 7.1, y: 2.3, w: 2.8, h: 0.28,
    rectRadius: 0.14, fill: { color: C.emeraldLight }, line: { color: 'C2E5CD', width: 1 }
  });
  slide.addText('COMMERCE & WORKFLOW · FULLSTACK', {
    x: 7.1, y: 2.3, w: 2.8, h: 0.28,
    fontSize: 8, fontFace: 'Calibri', bold: true, color: C.emerald, align: 'center', valign: 'middle', margin: 0
  });

  slide.addText('Enterprise Client Web Portal', {
    x: 7.1, y: 2.7, w: 5.0, h: 0.45,
    fontSize: 18, fontFace: 'Georgia', bold: true, color: C.ink, margin: 0
  });

  slide.addText(
    'A custom full-stack web application developed to manage client invoicing, appointment scheduling, and automated PDF receipt generation with role-based access control and MySQL data integrity.\n\n' +
    'Delivered as a production freelance solution for a commercial service provider.',
    {
      x: 7.1, y: 3.25, w: 5.0, h: 1.35,
      fontSize: 10.5, fontFace: 'Calibri', color: C.inkSoft, lineSpacingMultiple: 1.25, margin: 0
    }
  );

  const clientFeatures = [
    '• Automated PDF invoice and receipt generation engine.',
    '• Role-based authentication (Client, Staff, Administrator).',
    '• Automated appointment calendar with SMS/Email notifications.',
    '• Zero data discrepancy audit logs for financial reconciliation.'
  ];
  clientFeatures.forEach((cf, idx) => {
    slide.addText(cf, {
      x: 7.1, y: 4.75 + (idx * 0.36), w: 5.0, h: 0.34,
      fontSize: 9.5, fontFace: 'Calibri', color: C.inkSoft, margin: 0
    });
  });

  slide.addText('TECH STACK: Laravel  ·  Vue.js 3  ·  Vite  ·  MySQL  ·  Tailwind CSS', {
    x: 7.1, y: 6.35, w: 5.0, h: 0.3,
    fontSize: 8.5, fontFace: 'Calibri', bold: true, color: C.emerald, margin: 0
  });

  slide.addNotes('Supplementary archive showcasing JiwaKu mental wellness app and an Enterprise Client Web Portal.');
}

// ==========================================
// SLIDE 10: CAREER JOURNEY & MILESTONES
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.paperBg };
  addTopNav(slide, '09 · Career Journey', '10 / 11');
  addSlideHeading(slide, 'Track Record of Impact & Milestones', 'Consistent trajectory across enterprise software engineering, academic excellence, and continuous growth.');

  const milestones = [
    {
      period: 'DEC 2025 – PRESENT (~11 MOS)',
      role: 'Backend Developer Intern',
      org: 'Badan Sistem Informasi · Universitas Islam Indonesia',
      desc: 'Developing RESTful APIs with PHP, Laravel, Lumen, designing database ERDs, API testing with Postman, Angular frontend integration, and MCP AI automated summaries.',
      badge: 'PRODUCTION'
    },
    {
      period: 'AUG 2024 – DEC 2024',
      role: 'Enterprise Architecture & Systems Intern',
      org: 'Badan Sistem Informasi · Universitas Islam Indonesia',
      desc: 'Mapped enterprise business processes, maintained application catalog repositories, and evaluated service interdependencies across campus platforms.',
      badge: 'GOVERNANCE'
    },
    {
      period: 'MAY 2024 – AUG 2024',
      role: 'AWS re/Start Cloud Graduate',
      org: 'Amazon Web Services & Dicoding Indonesia',
      desc: 'Completed intensive 400+ hours training covering AWS cloud architecture, VPC networking, IAM security, Linux systems, and automated deployment pipelines.',
      badge: 'CLOUD'
    },
    {
      period: '2021 – 2026',
      role: 'Bachelor of Informatics (GPA 3.81 / 4.00)',
      org: 'Universitas Islam Indonesia',
      desc: 'Graduated with high honors. Authored published research on IoT smart parking in Technologia: Jurnal Ilmiah. Best Team Award at Informatics Expo.',
      badge: 'HONORS'
    }
  ];

  milestones.forEach((m, idx) => {
    const my = 2.05 + (idx * 1.22);
    addBentoCard(slide, 0.8, my, 11.733, 1.1);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.1, y: my + 0.2, w: 1.3, h: 0.26,
      rectRadius: 0.13, fill: { color: C.emeraldLight }, line: { color: 'C2E5CD', width: 1 }
    });
    slide.addText(m.badge, {
      x: 1.1, y: my + 0.2, w: 1.3, h: 0.26,
      fontSize: 7.5, fontFace: 'Calibri', bold: true, color: C.emerald, align: 'center', valign: 'middle', margin: 0
    });

    slide.addText(m.period, {
      x: 2.55, y: my + 0.2, w: 2.2, h: 0.26,
      fontSize: 9, fontFace: 'Calibri', bold: true, color: C.muted, valign: 'middle', margin: 0
    });

    slide.addText([
      { text: m.role, options: { bold: true, color: C.ink, fontSize: 13, fontFace: 'Georgia' } },
      { text: '  ·  ' + m.org, options: { color: C.muted, fontSize: 10, fontFace: 'Calibri' } }
    ], { x: 1.1, y: my + 0.52, w: 11.0, h: 0.26, margin: 0 });

    slide.addText(m.desc, {
      x: 1.1, y: my + 0.78, w: 11.0, h: 0.25,
      fontSize: 9.5, fontFace: 'Calibri', color: C.inkSoft, margin: 0
    });
  });

  slide.addNotes('Chronological career progression from university distinction to AWS certification and active backend engineering internship at BSI UII.');
}

// ==========================================
// SLIDE 11: CLOSING & CONTACT (DARK THEME)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.darkBg };
  addTopNav(slide, '10 · Get In Touch', '11 / 11', true);

  addBentoCard(slide, 0.8, 1.1, 11.733, 5.7, true);

  slide.addText('Let’s connect & build together.', {
    x: 1.3, y: 1.6, w: 8.0, h: 0.75,
    fontSize: 34, fontFace: 'Georgia', bold: true, color: C.white, margin: 0
  });

  slide.addText(
    'Looking for a backend or software developer? ' +
    'I focus on building reliable, well-structured, and maintainable systems that solve real user needs—eager to learn, contribute, and collaborate with an engineering team.',
    {
      x: 1.3, y: 2.45, w: 7.5, h: 0.8,
      fontSize: 12.5, fontFace: 'Calibri', color: C.darkTextSoft, lineSpacingMultiple: 1.25, margin: 0
    }
  );

  const contactBoxes = [
    {
      title: 'DIRECT INQUIRY',
      val: 'reikyranp@gmail.com',
      sub: 'Fast response · Primary communication channel',
      tag: 'EMAIL'
    },
    {
      title: 'PROFESSIONAL NETWORK',
      val: 'linkedin.com/in/reikypratama',
      sub: 'Connect on LinkedIn for career discussions',
      tag: 'LINKEDIN'
    },
    {
      title: 'OPEN SOURCE CODE',
      val: 'github.com/reiky03',
      sub: 'Explore full repositories, commits & architectures',
      tag: 'GITHUB'
    },
    {
      title: 'ONLINE PORTFOLIO & CV',
      val: 'https://reiky03.github.io',
      sub: 'Interactive web portfolio & official downloadable CV',
      tag: 'LIVE SITE'
    }
  ];

  contactBoxes.forEach((cb, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = 1.3 + (col * 5.6);
    const by = 3.8 + (row * 1.25);
    const bw = 5.25;

    slide.addShape(pres.ShapeType.roundRect, {
      x: bx, y: by, w: bw, h: 1.08,
      rectRadius: 0.14, fill: { color: '102018' }, line: { color: '244533', width: 1 }
    });

    slide.addText(cb.title, {
      x: bx + 0.25, y: by + 0.14, w: bw - 0.5, h: 0.2,
      fontSize: 8, fontFace: 'Calibri', bold: true, color: '6EE7B7', margin: 0
    });

    slide.addText(cb.val, {
      x: bx + 0.25, y: by + 0.38, w: bw - 0.5, h: 0.32,
      fontSize: 13, fontFace: 'Calibri', bold: true, color: C.white, margin: 0
    });

    slide.addText(cb.sub, {
      x: bx + 0.25, y: by + 0.72, w: bw - 0.5, h: 0.22,
      fontSize: 8.5, fontFace: 'Calibri', color: C.darkMuted, margin: 0
    });
  });

  slide.addText('© 2026 Reiky Aryanando Pratama · Handcrafted with precision & discipline · Yogyakarta, Indonesia', {
    x: 1.3, y: 6.4, w: 10.7, h: 0.25,
    fontSize: 8.5, fontFace: 'Calibri', color: C.darkMuted, margin: 0
  });

  slide.addNotes('Closing slide with direct email, LinkedIn, GitHub, and live website links.');
}

// ==========================================
// OUTPUT GENERATION
// ==========================================
const outputDir = path.join(__dirname, '..', 'public');
const outputFile = path.join(outputDir, 'reiky-portfolio-presentation.pptx');

pres.writeFile({ fileName: outputFile })
  .then(f => {
    console.log('SUCCESS: PowerPoint Presentation generated at:', f);
  })
  .catch(err => {
    console.error('ERROR generating PowerPoint presentation:', err);
    process.exit(1);
  });
