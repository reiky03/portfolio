export type ProjectShot = {
  src: string
  width: number
  height: number
  alt: string
  caption: string
}

export type Project = {
  slug: string
  name: string
  category: string
  summary: string
  detail: string
  contribution: string
  highlights: string[]
  stack: string[]
  github?: string
  shots: ProjectShot[]
}

export const projects: Project[] = [
  {
    slug: 'opsflow',
    name: 'OpsFlow',
    category: 'Service desk / Web platform',
    summary: 'Make internal IT work visible from request to resolution.',
    detail: 'A service desk and asset operations platform with role-aware ticket workflows, technician handoffs, notifications, and audit history.',
    contribution: 'Personal project',
    highlights: ['Ticket lifecycle', 'Role-based access', 'Asset operations'],
    stack: ['Laravel', 'React', 'TypeScript', 'PostgreSQL', 'Docker'],
    github: 'https://github.com/reiky03/OpsFlow',
    shots: [
      { src: '/images/opsflow-dashboard.webp', width: 1440, height: 960, alt: 'OpsFlow dashboard showing tickets, assets, and operational totals.', caption: 'Operations dashboard' },
      { src: '/images/opsflow-ticket.webp', width: 1440, height: 1242, alt: 'OpsFlow ticket detail showing assignment, status, and history.', caption: 'Ticket workflow' },
    ],
  },
  {
    slug: 'orderforge',
    name: 'OrderForge',
    category: 'Commerce / Reliability',
    summary: 'Checkout that stays consistent under pressure.',
    detail: 'An order and inventory platform exploring race-safe checkout, idempotent payments, event-driven processing, and operational monitoring.',
    contribution: 'Personal project',
    highlights: ['Stock reservation', 'Idempotent payments', 'Event recovery'],
    stack: ['Laravel', 'Next.js', 'PostgreSQL', 'Docker'],
    github: 'https://github.com/reiky03/OrderForge',
    shots: [
      { src: '/images/orderforge-hero.jpg', width: 1440, height: 900, alt: 'OrderForge customer storefront.', caption: 'Customer storefront' },
      { src: '/images/orderforge-pipeline.jpg', width: 1280, height: 1231, alt: 'OrderForge event pipeline monitoring interface.', caption: 'Event pipeline' },
    ],
  },
  {
    slug: 'park-masjid',
    name: 'Park Masjid',
    category: 'Android / IoT',
    summary: 'Parking availability at a glance for mosque visitors.',
    detail: 'An Android thesis project that brings parking counts from IoT devices into Firebase so visitors can see motorcycle and car availability. Admins can update capacity and prayer schedules.',
    contribution: 'Undergraduate thesis, Universitas Islam Indonesia',
    highlights: ['Live parking counts', 'Visitor and admin views', 'Prayer schedules'],
    stack: ['Kotlin', 'Firebase Realtime Database', 'Android'],
    github: 'https://github.com/reiky03/Park_Masjid',
    shots: [
      { src: '/images/park-masjid-availability.webp', width: 947, height: 2023, alt: 'Park Masjid Android screen showing motorcycle and car parking availability.', caption: 'Parking availability' },
      { src: '/images/park-masjid-prayer.webp', width: 943, height: 2023, alt: 'Park Masjid Android screen showing prayer times.', caption: 'Prayer schedule' },
      { src: '/images/park-masjid-admin-screens.png', width: 2668, height: 2309, alt: 'Park Masjid administrator dashboard and capacity editor from the project repository.', caption: 'Administrator view' },
    ],
  },
  {
    slug: 'kizen',
    name: 'Kizen',
    category: 'Comic reader / Flutter',
    summary: 'A cross-platform manga & comic reader with multi-source integration and cloud sync.',
    detail: 'A high-performance personal comic and manga reader app built with Flutter and Riverpod. Features multi-source extension scraping, Tachiyomi-inspired library and collection management, offline reading progress tracking, and Firebase cloud sync.',
    contribution: 'Personal project · Open source on GitHub',
    highlights: ['Multi-source extensions', 'Cloud sync & progress', 'Smooth scroll reader engine'],
    stack: ['Flutter', 'Dart', 'Riverpod', 'Firebase', 'Cloud Firestore'],
    github: 'https://github.com/reiky03/Aplikasi_Comic',
    shots: [
      { src: '/images/kizen-library.png', width: 1080, height: 2340, alt: 'Kizen library screen showing reading list and collections with dark AMOLED UI.', caption: 'Library and collections' },
      { src: '/images/kizen-welcome.png', width: 780, height: 1688, alt: 'Kizen onboarding and cloud synchronization screen.', caption: 'Cloud sync & onboarding' },
      { src: '/images/kizen-showcase.png', width: 1800, height: 1800, alt: 'Kizen reader architecture and branding showcase.', caption: 'Application overview' },
    ],
  },
  {
    slug: 'moneytrack',
    name: 'MoneyTrack',
    category: 'Personal finance / React Native',
    summary: 'Know where the money moves, even offline.',
    detail: 'A mobile finance tracker for recording income, expenses, and transfers across multiple wallets. It stores data on the device, shows cash-flow and category breakdowns, and supports over-the-air updates.',
    contribution: 'Personal project · Screens and features sourced from the public repository',
    highlights: ['Offline local storage', 'Multiple wallets and transfers', 'Cash-flow and category analysis'],
    stack: ['React Native', 'Expo', 'TypeScript', 'AsyncStorage'],
    github: 'https://github.com/reiky03/MoneyTrack',
    shots: [
      { src: '/images/moneytrack-dashboard.png', width: 1024, height: 861, alt: 'MoneyTrack repository screenshot of the net balance and cash-flow card.', caption: 'Balance and cash flow' },
      { src: '/images/moneytrack-categories.png', width: 896, height: 814, alt: 'MoneyTrack repository screenshot of expense categories and their totals.', caption: 'Category breakdown' },
    ],
  },
]
