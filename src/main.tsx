import { useEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { projects, type Project, type ProjectShot } from './projects'
import './style.css'

const links = {
  email: 'mailto:reikyranp@gmail.com',
  github: 'https://github.com/reiky03',
  linkedin: 'https://www.linkedin.com/in/reiky-aryanando-pratama-24a1a2296',
  cv: '/cv-reiky-aryanando-pratama.pdf',
  pptx: '/reiky-portfolio-presentation.pptx',
  gdocCv: 'https://docs.google.com/document/d/1a--QOVLKR8OdL_Tns12raDwgbL9PWdlVkTjrnXW8tNQ/edit?pli=1&tab=t.0#heading=h.abw9vt5zphl8',
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span className="arrow" aria-hidden="true">{diagonal ? '↗' : '→'}</span>
}

function DeckGallery({ project, isActive, onPreview }: { project: Project; isActive: boolean; onPreview: (shot: ProjectShot) => void }) {
  return (
    <div className={`deck-sheet__media deck-sheet__media--gallery deck-gallery deck-gallery--${project.slug}`} aria-label={`Three ${project.name} application screens`} aria-hidden={!isActive}>
      {project.shots.map((shot, index) => (
        <button className={`deck-gallery__screen deck-gallery__screen--${index + 1}`} type="button" key={shot.src} tabIndex={isActive ? 0 : -1} onClick={() => { if (isActive) onPreview(shot) }} aria-label={`Open ${project.name}: ${shot.caption}`}>
          <img src={shot.src} alt="" width={shot.width} height={shot.height} loading={index === 0 && isActive ? 'eager' : 'lazy'} />
        </button>
      ))}
      <span className="deck-gallery__hint" aria-hidden="true">Tap a screen to inspect <Arrow diagonal /></span>
    </div>
  )
}

function ProjectDeck({ activeIndex, hoveredIndex, onHoverProject, onSelectProject, onPreview }: { activeIndex: number; hoveredIndex: number | null; onHoverProject: (index: number | null) => void; onSelectProject: (index: number) => void; onPreview: (shot: ProjectShot) => void }) {
  const touchStartX = useRef<number | null>(null)
  const swipeJustFinished = useRef(false)
  const changeProject = (direction: number) => { onHoverProject(null); onSelectProject((activeIndex + direction + projects.length) % projects.length) }

  return (
    <div className="project-deck" role="region" aria-roledescription="carousel" aria-label="Featured project sheets" tabIndex={0} onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); changeProject(1) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); changeProject(-1) }
    }}>
      <div className="project-deck__stage">
      <div className="project-deck__stack" onTouchStart={event => { touchStartX.current = event.touches[0]?.clientX ?? null }} onTouchCancel={() => { touchStartX.current = null }} onTouchEnd={event => {
        if (touchStartX.current === null) return
        const distance = event.changedTouches[0]?.clientX - touchStartX.current
        touchStartX.current = null
        if (distance !== undefined && Math.abs(distance) > 45) {
          swipeJustFinished.current = true
          window.setTimeout(() => { swipeJustFinished.current = false }, 160)
          changeProject(distance < 0 ? 1 : -1)
        }
      }}>
        {projects.map((project, index) => {
          const depth = (index - activeIndex + projects.length) % projects.length
          const isActive = depth === 0
          const isHovered = hoveredIndex === index
          const position = depth === 0 ? 'center' : depth === 1 ? 'right-1' : depth === 2 ? 'right-2' : depth === 3 ? 'left-2' : 'left-1'
          const shot = project.shots[0]
          return (
            <div className={`deck-slot deck-slot--${position}${isHovered ? ' is-hovered' : ''}`} key={project.slug} onPointerEnter={() => onHoverProject(index)} onPointerLeave={() => onHoverProject(null)} onFocusCapture={() => onHoverProject(index)} onBlurCapture={() => onHoverProject(null)}>
            <article className={`deck-sheet deck-sheet--${project.slug}`}>
              <div className="deck-sheet__head"><span>{String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span><strong>{project.name}</strong></div>
              {project.shots.length === 3 ? (
                <DeckGallery project={project} isActive={isActive} onPreview={shot => { if (!swipeJustFinished.current) onPreview(shot) }} />
              ) : shot ? (
                <button className="deck-sheet__media" type="button" tabIndex={isActive ? 0 : -1} aria-hidden={!isActive} onClick={() => { if (isActive && !swipeJustFinished.current) onPreview(shot) }} aria-label={`Open ${project.name}: ${shot.caption}`}>
                  <img src={shot.src} width={shot.width} height={shot.height} alt={shot.alt} fetchPriority={index === 0 ? 'high' : undefined} />
                  <span>Open image <span aria-hidden="true">↗</span></span>
                </button>
              ) : null}
              <div className="deck-sheet__foot"><span>{project.category}</span><span>{project.shots.length === 3 ? 'Three app screens' : shot?.caption}</span></div>
              {!isActive && <button className="deck-sheet__pick" type="button" aria-label={`Show ${project.name} project`} onClick={() => { if (!swipeJustFinished.current) { onHoverProject(null); onSelectProject(index) } }} />}
            </article>
            </div>
          )
        })}
      </div>
      <div className="project-deck__controls">
        <button type="button" onClick={() => changeProject(-1)} aria-label="Previous project">←</button>
        <p aria-live="polite"><span>{String(activeIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span><strong>{projects[activeIndex].name}</strong></p>
        <button type="button" onClick={() => changeProject(1)} aria-label="Next project"><span>Next</span><span aria-hidden="true">→</span></button>
      </div>
      </div>
      <div className="project-deck__rail" aria-label="Choose a project slide">
        {projects.map((project, index) => {
          const shot = project.shots[0]
          return (
            <button
              className={`deck-tab deck-tab--${project.slug}${index === activeIndex ? ' is-active' : ''}`}
              type="button"
              aria-pressed={index === activeIndex}
              onPointerEnter={() => onHoverProject(index)}
              onPointerLeave={() => onHoverProject(null)}
              onFocus={() => onHoverProject(index)}
              onBlur={() => onHoverProject(null)}
              onClick={() => { onHoverProject(null); onSelectProject(index) }}
              key={project.slug}
            >
              <span className="deck-tab__image">{shot ? <img src={shot.src} alt="" loading="lazy" /> : <span aria-hidden="true">MT</span>}</span>
              <span className="deck-tab__label"><small>{String(index + 1).padStart(2, '0')}</small><strong>{project.name}</strong></span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProjectSection({
  project,
  index,
  onPreview,
}: {
  project: Project
  index: number
  onPreview: (shot: ProjectShot) => void
}) {
  const nextProject = projects[(index + 1) % projects.length]
  const isLast = index === projects.length - 1

  return (
    <article className={`project project--${project.slug}`} id={project.slug} aria-labelledby={`${project.slug}-title`}>
      <div className="project-inner container">
        <div className="project-heading" data-reveal>
          <h3 id={`${project.slug}-title`}>{project.name}</h3>
          <div className="project-heading__aside">
            <p className="project-summary">{project.summary}</p>
            <p className="project-category">{project.category}</p>
          </div>
        </div>

        <div className={`project-media project-media--${project.slug}`} data-reveal>
          {project.shots.map((shot, shotIndex) => (
            <figure className={`project-shot project-shot--${shotIndex + 1}`} key={shot.src}>
              <button type="button" onClick={() => onPreview(shot)} aria-label={`Open ${project.name}: ${shot.caption}`}>
                <img src={shot.src} width={shot.width} height={shot.height} alt={shot.alt} loading="lazy" />
                <span className="project-shot__zoom" aria-hidden="true">View image ↗</span>
              </button>
              <figcaption>{shot.caption}<span aria-hidden="true">↗</span></figcaption>
            </figure>
          ))}
        </div>

        <div className="project-copy" data-reveal>
          <span className="project-copy__label">The project</span>
          <p className="project-detail">{project.detail}</p>
          <span className="project-copy__label">Focus areas</span>
          <ul className="project-highlights" aria-label={`${project.name} highlights`}>
            {project.highlights.map(item => <li key={item}>{item}</li>)}
          </ul>
          <div className="project-facts">
            <p className="project-contribution">{project.contribution}</p>
            <ul className="project-stack" aria-label={`${project.name} technology stack`}>
              {project.stack.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
          {project.github ? (
            <a className="project-link" href={project.github} target="_blank" rel="noopener noreferrer">Explore the source <Arrow diagonal /></a>
          ) : (
            <p className="project-source-note">Project description from my CV. Public source and screenshots are not available here yet.</p>
          )}
        </div>

        <a className="project-next" href={!isLast ? `#${nextProject.slug}` : '#additional'} aria-label={!isLast ? `Next project: ${nextProject.name}` : 'Explore Supplementary Archive'}>
          <strong>{!isLast ? `Explore ${nextProject.name}` : 'Explore Archive'}</strong><Arrow diagonal />
        </a>
      </div>
    </article>
  )
}

function App() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [spotlightIndex, setSpotlightIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [preview, setPreview] = useState<ProjectShot | null>(null)
  const [activeChapter, setActiveChapter] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isInProjects, setIsInProjects] = useState(false)
  const [isOverDark, setIsOverDark] = useState(false)
  const [copied, setCopied] = useState(false)
  const chapterLinksRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const handleCopyEmail = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText('reikyranp@gmail.com')
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    const target = document.getElementById(id)
    if (!target) return
    const frame = window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant', block: 'start' }))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (preview && !dialog.open) dialog.showModal()
    if (!preview && dialog.open) dialog.close()
  }, [preview])

  useEffect(() => {
    document.documentElement.classList.add('js')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return () => { document.documentElement.classList.remove('js') }
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' })
    elements.forEach(element => {
      if (element.getBoundingClientRect().top < window.innerHeight * 0.92) element.classList.add('is-visible')
      observer.observe(element)
    })
    return () => { observer.disconnect(); document.documentElement.classList.remove('js') }
  }, [])

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = projects.findIndex(project => project.slug === entry.target.id)
          if (index !== -1) setActiveChapter(index)
        }
      })
    }, { rootMargin: '-12% 0px -52% 0px', threshold: 0 })
    projects.forEach(project => {
      const section = document.getElementById(project.slug)
      if (section) observer.observe(section)
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const projectsEl = document.querySelector('.projects')
    if (!projectsEl || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInProjects(entry.isIntersecting)
      },
      { rootMargin: '-6% 0px -10% 0px', threshold: 0 }
    )
    observer.observe(projectsEl)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const contactEl = document.getElementById('contact')
    if (!contactEl || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOverDark(entry.isIntersecting)
      },
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 }
    )
    observer.observe(contactEl)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const rail = chapterLinksRef.current
    const link = rail?.children[activeChapter] as HTMLElement | undefined
    if (!rail || !link) return
    rail.scrollTo({ left: link.offsetLeft - rail.offsetLeft - (rail.clientWidth - link.clientWidth) / 2, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }, [activeChapter])

  return (
    <>
      <a className="skip-link" href="#work">Skip to work</a>
      <header className={`site-header${isScrolled ? ' is-scrolled' : ''}${isOverDark ? ' is-dark' : ''}`}>
        <div className="site-header__inner container">
          <a className="wordmark" href="#top" aria-label="reiky03, back to top">reiky03<span>.</span></a>
          <nav aria-label="Primary navigation">
            <a href="#work">Work</a>
            <a href="#profile">Profile</a>
            <a href="#contact">Contact</a>
            <a href={links.cv} target="_blank" rel="noopener noreferrer" className="site-header__cv" title="View & Download PDF Resume">
              <span>Resume</span> <Arrow diagonal />
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        <div className="opening">
          <section className="hero container" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="hero-intro">Reiky Aryanando Pratama <span>Yogyakarta, Indonesia</span></p>
              <h1 id="hero-title">Software for<br /><span>real life.</span></h1>
              <div className="hero-copy__lead-wrap">
                <p className="hero-lead">I build thoughtful web, mobile, and backend systems that make complicated work easier to use.</p>
                <div className="hero-actions">
                  <a className="hero-primary" href="#work">Explore projects <Arrow /></a>
                  <a className="hero-secondary hero-secondary--cv" href={links.cv} target="_blank" rel="noopener noreferrer" title="View & Download PDF Resume">
                    <span>Resume / CV</span> <Arrow diagonal />
                  </a>
                  <a className="hero-secondary" href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <Arrow diagonal /></a>
                </div>
              </div>
            </div>
            <ProjectDeck activeIndex={activeIndex} hoveredIndex={hoveredIndex} onHoverProject={setHoveredIndex} onSelectProject={setActiveIndex} onPreview={setPreview} />
          </section>
        </div>

        <section className="work-intro" id="work" aria-labelledby="work-title">
          <div className="container work-intro__inner" data-reveal>
            <div className="work-intro__mast">
              <div className="work-intro__heading-group">
                <div className="work-intro__tag">
                  <span className="work-intro__tag-dot" aria-hidden="true" />
                  <span>INDEX [01 — 05] // REPERTORY</span>
                </div>
                <h2 id="work-title">Selected work.</h2>
              </div>
              <div className="work-intro__mast-desc">
                <p>Five engineered systems spanning service desk operations, idempotent commerce, public IoT infrastructure, and high-performance mobile reading.</p>
                <span className="work-intro__mast-sub">Select any chapter to inspect the architectural decisions, tech stack, and verified screens.</span>
              </div>
            </div>

            <div className="work-intro__body">
              <div className="work-intro__showcase-stage">
                <a
                  className={`work-intro__preview work-intro__preview--${projects[spotlightIndex].slug}`}
                  href={`#${projects[spotlightIndex].slug}`}
                  aria-label={`View ${projects[spotlightIndex].name} case study`}
                >
                  <div className="work-intro__preview-chrome">
                    <span className="work-intro__preview-dots" aria-hidden="true"><i/><i/><i/></span>
                    <span className="work-intro__preview-ch-title">{projects[spotlightIndex].name} · {projects[spotlightIndex].category}</span>
                    <span className="work-intro__preview-ch-tag">CHAPTER {String(spotlightIndex + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="work-intro__preview-media" key={projects[spotlightIndex].slug}>
                    {projects[spotlightIndex].shots.slice(0, 2).map((shot, sIndex) => (
                      <img src={shot.src} alt="" width={shot.width} height={shot.height} key={shot.src} className={`work-intro__preview-img--${sIndex + 1}`} />
                    ))}
                  </div>
                  <div className="work-intro__preview-foot">
                    <div className="work-intro__preview-meta">
                      <strong>{projects[spotlightIndex].name}</strong>
                      <span>{projects[spotlightIndex].category}</span>
                    </div>
                    <span className="work-intro__preview-btn">Explore Case Study <Arrow diagonal /></span>
                  </div>
                </a>
              </div>

              <nav className="work-intro__ledger" aria-label="Explore selected projects">
                <div className="work-intro__ledger-header" aria-hidden="true">
                  <span>NO.</span>
                  <span>PROJECT & DOMAIN</span>
                  <span>ACTION</span>
                </div>
                <div className="work-intro__ledger-track">
                  {projects.map((project, index) => {
                    const isSelected = spotlightIndex === index
                    return (
                      <a
                        href={`#${project.slug}`}
                        key={project.slug}
                        className={`work-intro__ledger-row work-intro__ledger-row--${project.slug}${isSelected ? ' is-current' : ''}`}
                        onPointerEnter={() => setSpotlightIndex(index)}
                        onFocus={() => setSpotlightIndex(index)}
                      >
                        <span className="work-intro__ledger-num">{String(index + 1).padStart(2, '0')}</span>
                        <div className="work-intro__ledger-main">
                          <strong className="work-intro__ledger-title">{project.name}</strong>
                          <span className="work-intro__ledger-sub">{project.category}</span>
                          <div className="work-intro__ledger-stack-preview">
                            {project.stack.slice(0, 3).map(st => <span key={st}>{st}</span>)}
                          </div>
                        </div>
                        <span className="work-intro__ledger-action" aria-hidden="true">
                          <Arrow diagonal />
                        </span>
                      </a>
                    )
                  })}
                </div>
              </nav>
            </div>
          </div>
        </section>

        <div className="project-chapters">
          <nav className={`chapter-nav${isInProjects ? ' is-visible' : ''}`} aria-label="Project directory">
            <div className="chapter-nav__inner">
              <div className="chapter-nav__header">
                <span className="chapter-nav__badge">{String(activeChapter + 1).padStart(2, '0')}</span>
                <div className="chapter-nav__header-info">
                  <span className="chapter-nav__eyebrow">Projects</span>
                  <span className="chapter-nav__count">{String(activeChapter + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
                </div>
              </div>
              <div className="chapter-nav__track" ref={chapterLinksRef}>
                {projects.map((project, index) => {
                  const isActive = activeChapter === index
                  return (
                    <a
                      key={project.slug}
                      href={`#${project.slug}`}
                      className={`chapter-nav__item${isActive ? ' is-active' : ''}`}
                      aria-current={isActive ? 'location' : undefined}
                      onClick={() => setActiveChapter(index)}
                      title={`${project.name} — ${project.category}`}
                    >
                      <span className="chapter-nav__pip-box" aria-hidden="true">
                        <span className="chapter-nav__pip" />
                      </span>
                      <div className="chapter-nav__meta">
                        <div className="chapter-nav__meta-row">
                          <span className="chapter-nav__num">{String(index + 1).padStart(2, '0')}</span>
                          <strong className="chapter-nav__title">{project.name}</strong>
                        </div>
                        <span className="chapter-nav__category">{project.category}</span>
                      </div>
                      <span className="chapter-nav__arrow" aria-hidden="true">↗</span>
                    </a>
                  )
                })}
              </div>
            </div>
          </nav>

          <div className="projects" aria-label="Project case studies">
            {projects.map((project, index) => (
              <ProjectSection key={project.slug} project={project} index={index} onPreview={setPreview} />
            ))}
          </div>
        </div>

        <section className="additional container" id="additional" aria-labelledby="additional-title" data-reveal>
          <div className="additional-header">
            <div className="section-label-capsule">
              <span className="section-label-dot" aria-hidden="true" />
              <span>SUPPLEMENTARY ARCHIVE</span>
            </div>
            <h2 id="additional-title">Also in the making.</h2>
            <p className="additional-intro">Additional explorations and production deliveries from university research and freelance engagements.</p>
          </div>
          <div className="additional-bento">
            <div className="additional-card additional-card--jiwaku">
              <div className="additional-card__top">
                <span className="additional-card__tag">HEALTH & WELLNESS · ANDROID</span>
                <span className="additional-card__context">Undergraduate project</span>
              </div>
              <h3 className="additional-card__title">JiwaKu Mental Health App</h3>
              <p className="additional-card__desc">A comprehensive mental wellness support app built with Kotlin, featuring real-time counseling chat, emergency psychiatric helpline routing, guided audio meditation, and Firebase Firestore authentication.</p>
              <div className="additional-card__stack">
                <span>Kotlin</span>
                <span>Android SDK</span>
                <span>Firebase</span>
                <span>Material 3</span>
              </div>
            </div>
            <div className="additional-card additional-card--client">
              <div className="additional-card__top">
                <span className="additional-card__tag">COMMERCE & WORKFLOW · FULLSTACK</span>
                <span className="additional-card__context">Freelance delivery</span>
              </div>
              <h3 className="additional-card__title">Enterprise Client Web Portal</h3>
              <p className="additional-card__desc">A custom full-stack web application developed to manage client invoicing, appointment scheduling, and automated PDF receipt generation with role-based access control and MySQL data integrity.</p>
              <div className="additional-card__stack">
                <span>Laravel</span>
                <span>Vue.js 3</span>
                <span>Vite</span>
                <span>MySQL</span>
                <span>Tailwind CSS</span>
              </div>
            </div>
          </div>
        </section>

        <section className="profile" id="profile" aria-labelledby="profile-title">
          <div className="container profile-grid" data-reveal>
            <div className="profile-heading">
              <div className="profile-capsule">
                <span className="profile-capsule__dot" aria-hidden="true" />
                <span>ENGINEER PROFILE & CREDENTIALS</span>
              </div>
              <h2 id="profile-title">Beyond the code.</h2>
              <p className="profile-lead">
                I’m an Informatics graduate (GPA 3.81/4.00) and Backend Developer Intern at Badan Sistem Informasi Universitas Islam Indonesia. I specialize in resilient API systems, data architecture, and clear product engineering.
              </p>
              <div className="profile-meta-pills">
                <div className="profile-pill">
                  <span className="profile-pill__key">CURRENT STATUS</span>
                  <span className="profile-pill__val">Backend Developer Intern @ Badan Sistem Informasi Universitas Islam Indonesia</span>
                </div>
                <div className="profile-pill">
                  <span className="profile-pill__key">EDUCATION</span>
                  <span className="profile-pill__val">Bachelor of Informatics, Universitas Islam Indonesia · GPA 3.81 / 4.00</span>
                </div>
                <div className="profile-pill">
                  <span className="profile-pill__key">BASE LOCATION</span>
                  <span className="profile-pill__val">Yogyakarta, Indonesia (WIB)</span>
                </div>
                <a className="profile-pill profile-pill--action" href={links.cv} target="_blank" rel="noopener noreferrer" title="Download Official CV (PDF)">
                  <span className="profile-pill__key">OFFICIAL RESUME</span>
                  <span className="profile-pill__val">Download CV (PDF) <Arrow diagonal /></span>
                </a>
                <a className="profile-pill profile-pill--action" href={links.pptx} download="reiky-portfolio-presentation.pptx" title="Download Presentation Deck (PPTX)">
                  <span className="profile-pill__key">EXECUTIVE DECK</span>
                  <span className="profile-pill__val">Download PPTX <Arrow diagonal /></span>
                </a>
              </div>
            </div>

            <div className="profile-bento">
              <div className="profile-bento__card profile-bento__card--featured">
                <div className="profile-card__head">
                  <span className="profile-card__badge">CURRENT ROLE · SINCE DEC 2025</span>
                  <span className="profile-card__org">Badan Sistem Informasi · Universitas Islam Indonesia</span>
                </div>
                <h3 className="profile-card__role">Backend Developer Intern</h3>
                <p className="profile-card__summary">
                  Architecting and maintaining high-performance REST APIs with Laravel and Lumen, structuring normalized MySQL schemas, executing automated API regression suites, and pioneering Model Context Protocol (MCP) AI integrations for automated campus intelligence.
                </p>
                <div className="profile-card__tags">
                  <span>Laravel / Lumen</span>
                  <span>REST APIs</span>
                  <span>MySQL Tuning</span>
                  <span>MCP AI Agent Integration</span>
                  <span>Security Hardening</span>
                </div>
              </div>

              <div className="profile-bento__grid-sub">
                <div className="profile-bento__card">
                  <span className="profile-sub-label">ACADEMIC FOUNDATION</span>
                  <h4>Bachelor of Informatics</h4>
                  <p className="profile-sub-text">Universitas Islam Indonesia (2021–2026). Graduated with GPA 3.81 / 4.00. Focus on Distributed Systems, Software Engineering, and Database Architecture.</p>
                </div>
                <div className="profile-bento__card">
                  <span className="profile-sub-label">RESEARCH & RECOGNITION</span>
                  <h4>Published Researcher</h4>
                  <p className="profile-sub-text">Park Masjid IoT & Android thesis published in <em>Technologia: Jurnal Ilmiah</em> (2026). Best Team Award at Informatics Expo Design Thinking (2022).</p>
                </div>
              </div>

              <div className="profile-bento__card profile-bento__card--certs">
                <span className="profile-sub-label">PROFESSIONAL CERTIFICATIONS & TRAINING</span>
                <div className="profile-cert-grid">
                  <div className="profile-cert-item">
                    <strong>AWS re/Start</strong>
                    <span>Amazon Web Services · Cloud Architecture (2026)</span>
                  </div>
                  <div className="profile-cert-item">
                    <strong>Cisco Cyber Threat Management</strong>
                    <span>Cisco Networking Academy · Security Fundamentals</span>
                  </div>
                  <div className="profile-cert-item">
                    <strong>Dicoding Back-End Clean Architecture</strong>
                    <span>Clean Architecture, Dependency Injection & Testing</span>
                  </div>
                  <div className="profile-cert-item">
                    <strong>RevoU Software Engineering</strong>
                    <span>Full-stack web fundamentals & agile teamwork</span>
                  </div>
                  <div className="profile-cert-item">
                    <strong>IBM SkillsBuild & Hacktiv8</strong>
                    <span>Generative AI Code Generation & Optimization</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="capabilities container" id="capabilities" aria-labelledby="capabilities-title" data-reveal>
          <div className="capabilities-mast">
            <div className="section-label-capsule">
              <span className="section-label-dot" aria-hidden="true" />
              <span>ENGINEERING TOOLKIT & COMPETENCIES</span>
            </div>
            <h2 id="capabilities-title">What I build with.</h2>
            <p>A focused technology stack refined through production backend internships, academic research, and full-stack software delivery.</p>
          </div>
          <div className="capabilities-matrix">
            <div className="cap-card">
              <div className="cap-card__header">
                <span className="cap-card__num">01</span>
                <h3 className="cap-card__title">Backend & Systems</h3>
              </div>
              <p className="cap-card__desc">Reliable server architectures, high-concurrency API endpoints, and structured protocol communications.</p>
              <div className="cap-card__chips">
                <span className="cap-chip">PHP</span>
                <span className="cap-chip">Laravel</span>
                <span className="cap-chip">Lumen</span>
                <span className="cap-chip">RESTful APIs</span>
                <span className="cap-chip">Model Context Protocol (MCP)</span>
                <span className="cap-chip">RBAC Security</span>
              </div>
            </div>

            <div className="cap-card">
              <div className="cap-card__header">
                <span className="cap-card__num">02</span>
                <h3 className="cap-card__title">Web & Interfaces</h3>
              </div>
              <p className="cap-card__desc">Interactive, accessible, and fast web applications with crisp design systems and zero layout thrash.</p>
              <div className="cap-card__chips">
                <span className="cap-chip">TypeScript</span>
                <span className="cap-chip">React</span>
                <span className="cap-chip">Next.js</span>
                <span className="cap-chip">Vue.js</span>
                <span className="cap-chip">Tailwind CSS</span>
                <span className="cap-chip">GSAP Motion</span>
              </div>
            </div>

            <div className="cap-card">
              <div className="cap-card__header">
                <span className="cap-card__num">03</span>
                <h3 className="cap-card__title">Mobile Engineering</h3>
              </div>
              <p className="cap-card__desc">Native and cross-platform mobile apps with fluid animations, offline caches, and hardware integrations.</p>
              <div className="cap-card__chips">
                <span className="cap-chip">Flutter & Dart</span>
                <span className="cap-chip">Riverpod State</span>
                <span className="cap-chip">Kotlin (Android)</span>
                <span className="cap-chip">React Native</span>
                <span className="cap-chip">Expo</span>
                <span className="cap-chip">AsyncStorage</span>
              </div>
            </div>

            <div className="cap-card">
              <div className="cap-card__header">
                <span className="cap-card__num">04</span>
                <h3 className="cap-card__title">Data & Infrastructure</h3>
              </div>
              <p className="cap-card__desc">Normalized data models, real-time database synchronizations, and containerized deployment pipelines.</p>
              <div className="cap-card__chips">
                <span className="cap-chip">PostgreSQL</span>
                <span className="cap-chip">MySQL</span>
                <span className="cap-chip">Firebase Realtime / Firestore</span>
                <span className="cap-chip">Docker</span>
                <span className="cap-chip">AWS Cloud</span>
                <span className="cap-chip">Git Workflows</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer
        className="contact"
        id="contact"
        aria-labelledby="contact-title"
      >
        <div className="contact-ambient" aria-hidden="true" />
        <div className="container contact-container" data-reveal>
          <div className="contact-bento ios-glass-dark">
            <div className="contact-bento__grid">
              <div className="contact-bento__left">
                <div className="contact-badge">
                  <span className="contact-pulse" aria-hidden="true" />
                  <span>AVAILABLE FOR ROLES & CONTRACTS · 2026</span>
                </div>
                <h2 id="contact-title">Let’s build software<br />that lasts.</h2>
                <p className="contact-subtitle">
                  Have a project in mind or looking for a backend / full-stack engineer? I’m open to full-time opportunities, high-impact collaborations, and ambitious builds.
                </p>
                <div className="contact-location-info">
                  <span className="contact-location-dot" aria-hidden="true" />
                  <span>Based in Yogyakarta, Indonesia · Open to remote worldwide</span>
                </div>
              </div>

              <div className="contact-bento__right">
                <div className="contact-email-card">
                  <div className="contact-email-card__info">
                    <span className="contact-email-card__label">DIRECT INQUIRY</span>
                    <a className="contact-email-card__address" href={links.email}>
                      reikyranp@gmail.com
                    </a>
                  </div>
                  <div className="contact-email-card__actions">
                    <a className="contact-email-card__send" href={links.email} aria-label="Send email to reikyranp@gmail.com" title="Open mail client">
                      <Arrow diagonal />
                    </a>
                    <button
                      type="button"
                      className={`contact-email-card__copy${copied ? ' is-copied' : ''}`}
                      onClick={handleCopyEmail}
                      aria-live="polite"
                    >
                      {copied ? 'Copied to Clipboard! ✓' : 'Copy Address'}
                    </button>
                  </div>
                </div>

                <div className="contact-social-row">
                  <a className="contact-social-pill contact-social-pill--cv" href={links.cv} target="_blank" rel="noopener noreferrer" title="Download PDF Resume">
                    <span>Download CV (PDF)</span> <Arrow diagonal />
                  </a>
                  <a className="contact-social-pill contact-social-pill--cv" href={links.pptx} download="reiky-portfolio-presentation.pptx" title="Download Presentation Deck (PPTX)">
                    <span>Download Deck (PPTX)</span> <Arrow diagonal />
                  </a>
                  <a className="contact-social-pill" href={links.linkedin} target="_blank" rel="noopener noreferrer">
                    <span>LinkedIn</span> <Arrow diagonal />
                  </a>
                  <a className="contact-social-pill" href={links.github} target="_blank" rel="noopener noreferrer">
                    <span>GitHub</span> <Arrow diagonal />
                  </a>
                  <a className="contact-social-pill" href={links.email}>
                    <span>Direct Email</span> <Arrow diagonal />
                  </a>
                </div>
              </div>
            </div>

            <div className="contact-footer-bar">
              <span>© 2026 Reiky Aryanando Pratama. Handcrafted with precision & discipline.</span>
              <div className="contact-footer-right">
                <span>Yogyakarta (WIB · UTC+7)</span>
                <a className="contact-top-btn" href="#top">Back to top ↑</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <dialog className="image-dialog" ref={dialogRef} onClose={() => setPreview(null)} onClick={event => { if (event.target === event.currentTarget) setPreview(null) }}>
        {preview && <div className="dialog-panel"><div className="dialog-bar"><p>{preview.caption}</p><button type="button" onClick={() => setPreview(null)} aria-label="Close screenshot viewer">Close</button></div><img src={preview.src} width={preview.width} height={preview.height} alt={preview.alt} /></div>}
      </dialog>
    </>
  )
}

const rootElement = document.getElementById('root') as (HTMLElement & { portfolioRoot?: Root })
const root = rootElement.portfolioRoot ?? createRoot(rootElement)
rootElement.portfolioRoot = root
root.render(<App />)
