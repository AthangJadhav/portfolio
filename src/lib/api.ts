// Central place for talking to the portfolio data.
// This project is converted to a fully static, zero-cost deployment model.
// All content is stored in browser localStorage so it works on GitHub Pages
// without a backend or a paid hosting tier.

const TOKEN_KEY = "admin_token"
const STORAGE_KEY = "portfolio-static-data-v1"

export type Section = {
  id: string
  title: string
  caption: string
  videoUrl: string | null
  isVisible: boolean
  position: number
  createdAt: string
  updatedAt: string
}

export type PricingPlan = {
  number: string
  title: string
  description: string
  price: string
  unit: string
  detail: string
  featured?: boolean
}

export type SiteContent = {
  heroName: string
  heroRole: string
  introEyebrow: string
  introHeading: string
  contactEyebrow: string
  contactHeading: string
  contactDescription: string
  contactEmail: string
  pricingEyebrow: string
  pricingHeading: string
  pricingNote: string
  pricingPlans: PricingPlan[]
}

const defaultLocalSections: Section[] = [
  {
    id: "section-vlogs",
    title: "Vlogs",
    caption: "Narrative-driven edits with paced storytelling, music timing, and transitions that keep a vlog watchable from start to finish.",
    videoUrl: "./videos/1.mp4",
    isVisible: false,
    position: 0,
    createdAt: "2026-10-20T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
  },
  {
    id: "section-brand-edit",
    title: "Brand Edit",
    caption: "Shot and edited a promotional reel showcasing the new store of Kaveri Jewellers.",
    videoUrl: "./videos/4.mp4",
    isVisible: true,
    position: 1,
    createdAt: "2026-10-20T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
  },
  {
    id: "section-shortfilm",
    title: "Shortfilm",
    caption: "Edited a short film built entirely from still photographs, carefully sequencing and timing each image to create the illusion of motion.",
    videoUrl: "./videos/6.mp4",
    isVisible: true,
    position: 2,
    createdAt: "2026-10-20T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
  },
  {
    id: "section-podcast",
    title: "Podcast",
    caption: "I turned the long form video to a short form.",
    videoUrl: "./videos/1.mp4",
    isVisible: true,
    position: 3,
    createdAt: "2026-10-20T15:24:52.822Z",
    updatedAt: "2026-10-20T15:24:52.822Z",
  },
  {
    id: "section-teaser",
    title: "Music-synced teaser",
    caption: "Trailer-style edit with cuts landing on the beat.",
    videoUrl: "./videos/4.mp4",
    isVisible: true,
    position: 4,
    createdAt: "2026-10-20T17:32:15.863Z",
    updatedAt: "2026-10-20T17:32:15.863Z",
  },
]

const defaultPricingPlans: PricingPlan[] = [
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

const defaultLocalSite: SiteContent = {
  heroName: "Athang Jadhav",
  heroRole: "Video Editor",
  introEyebrow: "Selected Work",
  introHeading: "Things I've edited.",
  contactEyebrow: "Have a project in mind?",
  contactHeading: "Let's work together.",
  contactDescription: "Send me your raw footage.",
  contactEmail: "editswithathang@gmail.com",
  pricingEyebrow: "TRANSPARENT PRICING",
  pricingHeading: "Clear scope.\nBetter stories.",
  pricingNote: "Client provides raw footage, B-roll, and music. Revisions cover adjustments to the agreed edit.",
  pricingPlans: defaultPricingPlans,
}

function normalizePricingPlan(plan?: Partial<PricingPlan>): PricingPlan {
  return {
    number: plan?.number ?? "01",
    title: plan?.title ?? "Single Short",
    description: plan?.description ?? "One short-form edit, captions and basic graphics.",
    price: plan?.price ?? "₹1,000",
    unit: plan?.unit ?? "/ video",
    detail: plan?.detail ?? "2–3 day turnaround · 1 revision",
    featured: Boolean(plan?.featured),
  }
}

export function normalizeSiteContent(site: Partial<SiteContent> | null): SiteContent {
  const pricingPlans = Array.isArray(site?.pricingPlans) && site.pricingPlans.length
    ? site.pricingPlans.map((plan) => normalizePricingPlan(plan))
    : defaultPricingPlans

  return {
    heroName: site?.heroName ?? "Athang Jadhav",
    heroRole: site?.heroRole ?? "Video Editor",
    introEyebrow: site?.introEyebrow ?? "Selected Work",
    introHeading: site?.introHeading ?? "Things I've edited.",
    contactEyebrow: site?.contactEyebrow ?? "Have a project in mind?",
    contactHeading: site?.contactHeading ?? "Let's work together.",
    contactDescription: site?.contactDescription ?? "Send me your raw footage.",
    contactEmail: site?.contactEmail ?? "editswithathang@gmail.com",
    pricingEyebrow: site?.pricingEyebrow ?? "TRANSPARENT PRICING",
    pricingHeading: site?.pricingHeading ?? "Clear scope.\nBetter stories.",
    pricingNote:
      site?.pricingNote ??
      "Client provides raw footage, B-roll, and music. Revisions cover adjustments to the agreed edit.",
    pricingPlans,
  }
}

function sanitizeSections(sections: Section[]): Section[] {
  const sanitized = Array.isArray(sections) ? sections : []
  const defaultById = new Map(defaultLocalSections.map((section) => [section.id, section]))

  return sanitized.map((section) => {
    const fallback = defaultById.get(section.id)
    if (!fallback) return section

    const merged = { ...fallback, ...section }
    if (!merged.videoUrl && fallback.videoUrl) {
      merged.videoUrl = fallback.videoUrl
    }

    return {
      ...merged,
      title: section.title || fallback.title,
      caption: section.caption || fallback.caption,
      isVisible: typeof section.isVisible === "boolean" ? section.isVisible : fallback.isVisible,
      position: typeof section.position === "number" ? section.position : fallback.position,
    }
  })
}

function ensureStoredData() {
  if (typeof window === "undefined") {
    return { site: defaultLocalSite, sections: defaultLocalSections }
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const value = JSON.stringify({ site: defaultLocalSite, sections: defaultLocalSections })
    window.localStorage.setItem(STORAGE_KEY, value)
    return { site: defaultLocalSite, sections: defaultLocalSections }
  }

  try {
    const parsed = JSON.parse(raw)
    const site = normalizeSiteContent(parsed?.site ?? defaultLocalSite)
    const sections = sanitizeSections(Array.isArray(parsed?.sections) ? parsed.sections : defaultLocalSections)

    if (JSON.stringify(sections) !== JSON.stringify(parsed?.sections ?? defaultLocalSections)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ site, sections }))
    }

    return { site, sections }
  } catch {
    const value = JSON.stringify({ site: defaultLocalSite, sections: defaultLocalSections })
    window.localStorage.setItem(STORAGE_KEY, value)
    return { site: defaultLocalSite, sections: defaultLocalSections }
  }
}

function writeStoredData(site: SiteContent, sections: Section[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ site, sections }))
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `section-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeSectionOrder(sections: Section[]): Section[] {
  return [...sections]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((section, index) => ({ ...section, position: index }))
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  const cookieValue = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${TOKEN_KEY}=`))

  if (cookieValue) {
    return decodeURIComponent(cookieValue.slice(TOKEN_KEY.length + 1))
  }

  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  if (typeof window === "undefined") return
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; SameSite=Lax; max-age=${7 * 24 * 60 * 60}`
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  if (typeof window === "undefined") return
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
  window.localStorage.removeItem(TOKEN_KEY)
}

export function isLoggedIn(): boolean {
  return Boolean(getToken())
}

export function mediaUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith("blob:") || /^https?:\/\//i.test(path)) return path
  if (path.startsWith("./") || path.startsWith("../")) return path
  if (path.startsWith("/")) return path
  return path
}

export function fetchPublicSections(): Promise<Section[]> {
  const { sections } = ensureStoredData()
  return Promise.resolve(normalizeSectionOrder(sections))
}

export function fetchPublicSite(): Promise<SiteContent> {
  const { site } = ensureStoredData()
  return Promise.resolve(normalizeSiteContent(site))
}

export async function login(password: string): Promise<void> {
  if (!password || !password.trim()) {
    throw new Error("Password is required.")
  }

  setToken(password.trim())
}

export function logout() {
  clearToken()
}

export function fetchAdminSections(): Promise<Section[]> {
  const { sections } = ensureStoredData()
  return Promise.resolve(normalizeSectionOrder(sections))
}

export function fetchAdminSite(): Promise<SiteContent> {
  const { site } = ensureStoredData()
  return Promise.resolve(normalizeSiteContent(site))
}

export function updateSite(updates: Partial<SiteContent>): Promise<SiteContent> {
  const { site, sections } = ensureStoredData()
  const nextSite = normalizeSiteContent({ ...site, ...updates, pricingPlans: updates.pricingPlans ?? site.pricingPlans })
  writeStoredData(nextSite, sections)
  return Promise.resolve(nextSite)
}

type SectionFormInput = {
  title: string
  caption: string
  isVisible: boolean
  videoFile?: File | null
}

export function createSection(input: SectionFormInput): Promise<Section> {
  const { site, sections } = ensureStoredData()
  const nextSection: Section = {
    id: createId(),
    title: input.title.trim(),
    caption: input.caption.trim(),
    videoUrl: input.videoFile ? URL.createObjectURL(input.videoFile) : null,
    isVisible: input.isVisible !== false,
    position: sections.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const nextSections = normalizeSectionOrder([...sections, nextSection])
  writeStoredData(site, nextSections)
  return Promise.resolve(nextSections[nextSections.length - 1])
}

export function updateSection(id: string, input: Partial<SectionFormInput>): Promise<Section> {
  const { site, sections } = ensureStoredData()
  const section = sections.find((item: Section) => item.id === id)

  if (!section) {
    throw new Error("Section not found.")
  }

  const updatedSection: Section = {
    ...section,
    title: input.title !== undefined ? input.title.trim() : section.title,
    caption: input.caption !== undefined ? input.caption.trim() : section.caption,
    isVisible: input.isVisible !== undefined ? Boolean(input.isVisible) : section.isVisible,
    videoUrl: input.videoFile ? URL.createObjectURL(input.videoFile) : section.videoUrl,
    updatedAt: new Date().toISOString(),
  }

  const nextSections = normalizeSectionOrder(
    sections.map((item: Section) => (item.id === id ? updatedSection : item)),
  )
  writeStoredData(site, nextSections)
  return Promise.resolve(updatedSection)
}

export function deleteSection(id: string): Promise<void> {
  const { site, sections } = ensureStoredData()
  const nextSections = normalizeSectionOrder(
    sections.filter((section: Section) => section.id !== id),
  )
  writeStoredData(site, nextSections)
  return Promise.resolve()
}

export function reorderSections(order: string[]): Promise<Section[]> {
  const { site, sections } = ensureStoredData()
  const currentIds = new Set(sections.map((section: Section) => section.id))
  const sameSet = order.length === currentIds.size && order.every((id) => currentIds.has(id))

  if (!sameSet) {
    throw new Error("order must include every existing section id exactly once.")
  }

  const orderedSections = order
    .map((id: string) => sections.find((section: Section) => section.id === id))
    .filter((section): section is Section => Boolean(section))
  const nextSections = normalizeSectionOrder(
    orderedSections.map((section: Section, index: number) => ({
      ...section,
      position: index,
      updatedAt: new Date().toISOString(),
    })),
  )

  writeStoredData(site, nextSections)
  return Promise.resolve(nextSections)
}
