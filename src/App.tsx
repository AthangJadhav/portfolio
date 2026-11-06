import { useEffect, useState } from "react"
import "./App.css"
import { LoginModal } from "./components/LoginModal"
import { AdminDashboard } from "./components/AdminDashboard"
import { TopBar } from "./components/TopBar"
import {
  fetchPublicSections,
  fetchPublicSite,
  isLoggedIn,
  type Section,
  type SiteContent,
  mediaUrl,
} from "./lib/api"

type Panel = "pricing" | "contact" | null

function App() {
  const [site, setSite] = useState<SiteContent | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [selectedWork, setSelectedWork] = useState<Section | null>(null)
  const [activePanel, setActivePanel] = useState<Panel>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const loadPublicContent = async () => {
    try {
      const [siteData, sectionsData] = await Promise.all([
        fetchPublicSite(),
        fetchPublicSections(),
      ])
      setSite(siteData)
      setSections(sectionsData)
      setLoadError(false)
    } catch {
      setLoadError(true)
    }
  }

  useEffect(() => {
    loadPublicContent()
  }, [])

  useEffect(() => {
    if (!selectedWork && !activePanel) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedWork(null)
        setActivePanel(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedWork, activePanel])

  const handleAdminTrigger = () => {
    if (isLoggedIn()) setShowAdmin(true)
    else setShowLogin(true)
  }

  const handleLoginSuccess = () => {
    setShowLogin(false)
    setShowAdmin(true)
  }

  const pricingHeading = (site?.pricingHeading ?? "Clear scope.\nBetter stories.").split("\n")
  const pricingPlans = site?.pricingPlans && site.pricingPlans.length ? site.pricingPlans : [
    {
      number: "01",
      title: "Single Short",
      description: "One short-form edit, captions and basic graphics.",
      price: "₹1,000",
      unit: "/ video",
      detail: "2–3 day turnaround · 1 revision",
      featured: false,
    },
    {
      number: "02 · WEEKLY",
      title: "Weekly Pack",
      description: "Four shorts for a consistent publishing rhythm.",
      price: "₹3,200",
      unit: "/ week",
      detail: "4 videos · approx. 20% saving",
      featured: true,
    },
    {
      number: "03",
      title: "Monthly Pack",
      description: "Sixteen shorts planned for long-term consistency.",
      price: "₹13,000",
      unit: "/ month",
      detail: "16 videos · approx. 20% saving",
      featured: false,
    },
  ]

  const visibleSections = sections.filter((section) => section.isVisible)

  return showAdmin ? (
    <AdminDashboard
      onClose={() => setShowAdmin(false)}
      onContentChanged={loadPublicContent}
    />
  ) : (
    <div className="site-shell">
      <div className="ambient-glow ambient-glow--one" aria-hidden="true" />
      <div className="ambient-glow ambient-glow--two" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <img
        src="./art/athang-face.png"
        alt=""
        className="ambient-portrait"
        aria-hidden="true"
      />

      <TopBar onAdminTrigger={handleAdminTrigger} />

      <main className="landing-layout">
        <section className="landing-copy" aria-labelledby="hero-title">
          <div className="availability"><span className="availability__dot" /> AVAILABLE FOR SELECT PROJECTS</div>
          <p className="eyebrow">VIDEO EDITOR</p>
          <h1 id="hero-title">{site?.heroName ?? "Athang Jadhav"}<span className="hero-period">.</span></h1>
          <p className="hero-role">{site?.heroRole ?? "Video Editor"}<span className="hero-role__line" /></p>
          <p className="hero-summary">
            I turn raw footage into considered, story-first edits—with rhythm, clarity, and a reason to keep watching.
          </p>
          <div className="landing-meta">
            <span>STORYTELLING</span><i /> <span>PACING</span><i /> <span>RETENTION</span>
          </div>
          <div className="landing-index"><span>01 / 03</span><span className="landing-index__rule" /><span>SELECTED WORK</span></div>
        </section>

        <aside className="work-index" aria-labelledby="work-index-title">
          <div className="work-index__topline"><span>PORTFOLIO INDEX</span><span>{String(visibleSections.length).padStart(2, "0")} PROJECTS</span></div>
          <div className="work-index__heading">
            <p className="eyebrow">A FEW RECENT CUTS</p>
            <h2 id="work-index-title">Things I’ve<br /><em>edited.</em></h2>
          </div>
          <div className="work-list">
            {visibleSections.length ? visibleSections.map((section, index) => (
              <button className="work-list__item" type="button" key={section.id} onClick={() => setSelectedWork(section)}>
                <span className="work-list__number">{String(index + 1).padStart(2, "0")}</span>
                <span className="work-list__title">{section.title}</span>
                <span className="work-list__arrow" aria-hidden="true">↗</span>
              </button>
            )) : (
              <div className="work-list__empty">{loadError ? "Work is temporarily unavailable." : "New work is being prepared."}</div>
            )}
          </div>
          <p className="work-index__footnote">SELECT A PROJECT TO EXPLORE <span>↗</span></p>
        </aside>

        <div className="side-actions" aria-label="Explore portfolio">
          <button type="button" className="side-action" onClick={() => setActivePanel("pricing")}>
            <span className="side-action__index">01</span><span>Pricing</span><span className="side-action__arrow">↗</span>
          </button>
          <button type="button" className="side-action side-action--bright" onClick={() => setActivePanel("contact")}>
            <span className="side-action__index">02</span><span>Start a project</span><span className="side-action__arrow">↗</span>
          </button>
          <p className="side-actions__note">GOOD WORK STARTS<br />WITH A CONVERSATION.</p>
        </div>
      </main>

      <footer className="site-footer"><span>© {new Date().getFullYear()} {site?.heroName ?? "ATHANG JADHAV"}</span><span>CREATIVE PRACTICE</span><span className="site-footer__location"><i /> WORKING WORLDWIDE</span></footer>

      {selectedWork && (
        <div className="glass-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedWork(null) }}>
          <section className="project-dialog glass-panel" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title">
            <button className="dialog-close" type="button" onClick={() => setSelectedWork(null)} aria-label="Close project">×</button>
            <div className="dialog-kicker"><span>SELECTED WORK</span><span>PROJECT / {String(visibleSections.findIndex((item) => item.id === selectedWork.id) + 1).padStart(2, "0")}</span></div>
            <h2 id="project-dialog-title">{selectedWork.title}<span>.</span></h2>
            <div className="project-dialog__body">
              <div className="project-dialog__video">
                {mediaUrl(selectedWork.videoUrl) ? (
                  <video src={mediaUrl(selectedWork.videoUrl) ?? undefined} controls autoPlay playsInline preload="metadata" />
                ) : <div className="video-placeholder"><span>VIDEO PREVIEW</span><p>Coming soon</p></div>}
              </div>
              <div className="project-dialog__details">
                <p className="eyebrow">THE EDIT</p>
                <p className="project-dialog__description">{selectedWork.caption || "A selected edit focused on thoughtful pacing, clean visual choices, and a clear story."}</p>
                <div className="project-dialog__bottom"><span>CRAFTED WITH INTENTION</span><span>↗</span></div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activePanel && (
        <div className="glass-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setActivePanel(null) }}>
          <section className="info-dialog glass-panel" role="dialog" aria-modal="true" aria-labelledby="info-dialog-title">
            <button className="dialog-close" type="button" onClick={() => setActivePanel(null)} aria-label="Close">×</button>
            {activePanel === "pricing" ? <>
              <div className="dialog-kicker"><span>{site?.pricingEyebrow ?? "TRANSPARENT PRICING"}</span><span>SERVICES</span></div>
              <p className="eyebrow">BUILT AROUND YOUR OUTPUT</p>
              <h2 id="info-dialog-title">
                {pricingHeading.map((line, index) => (
                  <span key={line + index}>{line}{index < pricingHeading.length - 1 ? <><br /></> : null}</span>
                ))}
              </h2>
              <div className="price-options">
                {pricingPlans.map((plan) => (
                  <article key={`${plan.title}-${plan.number}`} className={plan.featured ? "price-options__featured" : undefined}>
                    <span className="price-options__number">{plan.number}</span>
                    <h3>{plan.title}</h3>
                    <p>{plan.description}</p>
                    <strong>{plan.price} <small>{plan.unit}</small></strong>
                    <span className="price-options__detail">{plan.detail}</span>
                  </article>
                ))}
              </div>
              <p className="pricing-note">{site?.pricingNote ?? "Client provides raw footage, B-roll, and music. Revisions cover adjustments to the agreed edit."}</p>
              <button className="dialog-cta" type="button" onClick={() => setActivePanel("contact")}>Discuss your project <span>↗</span></button>
            </> : <>
              <div className="dialog-kicker"><span>LET’S MAKE SOMETHING GOOD</span><span>CONTACT / 01</span></div>
              <p className="eyebrow">HAVE A PROJECT IN MIND?</p>
              <h2 id="info-dialog-title">Let’s work<br /><em>together.</em></h2>
              <p className="contact-dialog__copy">Tell me what you’re making, what you need, and where you want the edit to take your audience.</p>
              <a className="contact-email" href={`mailto:${site?.contactEmail ?? "editswithathang@gmail.com"}`}>
                <span>{site?.contactEmail ?? "editswithathang@gmail.com"}</span><span>↗</span>
              </a>
              <p className="contact-dialog__note">Usually the best first step is a short email with your idea, timeline, and reference links.</p>
            </>}
          </section>
        </div>
      )}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  )
}

export default App
