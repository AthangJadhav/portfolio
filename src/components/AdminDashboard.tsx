import { useEffect, useState } from "react"
import type { PricingPlan, Section, SiteContent } from "../lib/api"
import {
  createSection,
  deleteSection,
  fetchAdminSections,
  fetchAdminSite,
  logout,
  reorderSections,
  updateSection,
  updateSite,
} from "../lib/api"

type AdminDashboardProps = {
  onClose: () => void
  onContentChanged: () => void
}

type SiteFieldKey = Exclude<
  keyof SiteContent,
  "pricingEyebrow" | "pricingHeading" | "pricingNote" | "pricingPlans"
>

const SITE_FIELDS: { key: SiteFieldKey; label: string; multiline?: boolean }[] = [
  { key: "heroName", label: "Hero name" },
  { key: "heroRole", label: "Hero role" },
  { key: "introEyebrow", label: "Work section eyebrow" },
  { key: "introHeading", label: "Work section heading" },
  { key: "contactEyebrow", label: "Contact eyebrow" },
  { key: "contactHeading", label: "Contact heading" },
  { key: "contactDescription", label: "Contact description", multiline: true },
  { key: "contactEmail", label: "Contact email" },
]

const PRICING_FIELDS: { key: "pricingEyebrow" | "pricingHeading" | "pricingNote"; label: string; multiline?: boolean }[] = [
  { key: "pricingEyebrow", label: "Pricing eyebrow" },
  { key: "pricingHeading", label: "Pricing heading" },
  { key: "pricingNote", label: "Pricing note", multiline: true },
]

export function AdminDashboard({ onClose, onContentChanged }: AdminDashboardProps) {
  const [site, setSite] = useState<SiteContent | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingSite, setSavingSite] = useState(false)
  const [siteContentExpanded, setSiteContentExpanded] = useState(true)
  const [sectionsExpanded, setSectionsExpanded] = useState(true)

  const visibleSectionCount = sections.filter((section) => section.isVisible).length

  const [newTitle, setNewTitle] = useState("")
  const [newCaption, setNewCaption] = useState("")
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [siteData, sectionsData] = await Promise.all([
        fetchAdminSite(),
        fetchAdminSections(),
      ])
      setSite(siteData)
      setSections(sectionsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadInitialData = async () => {
      setError(null)

      try {
        const [siteData, sectionsData] = await Promise.all([
          fetchAdminSite(),
          fetchAdminSections(),
        ])

        if (!cancelled) {
          setSite(siteData)
          setSections(sectionsData)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load admin data.",
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadInitialData()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSiteFieldChange = (
    key: SiteFieldKey | "pricingEyebrow" | "pricingHeading" | "pricingNote",
    value: string,
  ) => {
    setSite((current) => (current ? { ...current, [key]: value } : current))
  }

  const updatePricingPlanField = (
    index: number,
    field: keyof PricingPlan,
    value: string | boolean,
  ) => {
    setSite((current) => {
      if (!current) return current
      const pricingPlans = [...current.pricingPlans]
      pricingPlans[index] = { ...pricingPlans[index], [field]: value }
      return { ...current, pricingPlans }
    })
  }

  const handleSaveSite = async () => {
    if (!site) return
    setSavingSite(true)
    setError(null)
    try {
      const payload = {
        ...site,
        pricingPlans: (site.pricingPlans ?? []).map((plan) => ({
          ...plan,
          featured: Boolean(plan.featured),
        })),
      }

      const updated = await updateSite(payload)
      const normalized = {
        ...payload,
        ...updated,
        pricingPlans: Array.isArray(updated.pricingPlans) && updated.pricingPlans.length
          ? updated.pricingPlans
          : payload.pricingPlans,
      }

      setSite(normalized)
      await loadAll()
      onContentChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save site content.")
    } finally {
      setSavingSite(false)
    }
  }

  const handleCreateSection = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    setError(null)
    try {
      await createSection({
        title: newTitle,
        caption: newCaption,
        isVisible: true,
        videoFile: newVideoFile,
      })
      setNewTitle("")
      setNewCaption("")
      setNewVideoFile(null)
      await loadAll()
      onContentChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create section.")
    } finally {
      setCreating(false)
    }
  }

  const handleSectionFieldChange = (id: string, key: "title" | "caption", value: string) => {
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, [key]: value } : section)),
    )
  }

  const preserveDrafts = (currentSection: Section, serverSection: Section): Section => ({
    ...serverSection,
    title: currentSection.title,
    caption: currentSection.caption,
  })

  const handleSaveSection = async (id: string) => {
    const section = sections.find((s) => s.id === id)
    if (!section) return
    setError(null)
    try {
      const updated = await updateSection(id, {
        title: section.title,
        caption: section.caption,
      })
      setSections((current) => current.map((s) => (s.id === id ? updated : s)))
      onContentChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save section.")
    }
  }

  const handleToggleVisibility = async (section: Section) => {
    setError(null)
    try {
      const updated = await updateSection(section.id, { isVisible: !section.isVisible })
      setSections((current) =>
        current.map((s) => (s.id === section.id ? preserveDrafts(s, updated) : s)),
      )
      onContentChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update visibility.")
    }
  }

  const handleReplaceVideo = async (id: string, file: File) => {
    setError(null)
    try {
      const updated = await updateSection(id, { videoFile: file })
      setSections((current) =>
        current.map((s) => (s.id === id ? preserveDrafts(s, updated) : s)),
      )
      onContentChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload video.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this section? This can't be undone.")) return
    setError(null)
    try {
      await deleteSection(id)
      setSections((current) => current.filter((s) => s.id !== id))
      onContentChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete section.")
    }
  }

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sections.length) return

    const reordered = [...sections]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    setSections(reordered)
    setError(null)

    try {
      const updated = await reorderSections(reordered.map((s) => s.id))
      setSections(
        updated.map((item) => {
          const draft = reordered.find((section) => section.id === item.id)
          return draft ? { ...item, title: draft.title, caption: draft.caption } : item
        }),
      )
      onContentChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder sections.")
      await loadAll()
    }
  }

  const handleDropAtIndex = async (targetIndex: number) => {
    if (!draggedSectionId) return

    const sourceIndex = sections.findIndex((section) => section.id === draggedSectionId)
    if (sourceIndex === -1 || sourceIndex === targetIndex) {
      setDraggedSectionId(null)
      return
    }

    const reordered = [...sections]
    const [moved] = reordered.splice(sourceIndex, 1)
    reordered.splice(targetIndex, 0, moved)

    setSections(reordered)
    setDraggedSectionId(null)
    setError(null)

    try {
      const updated = await reorderSections(reordered.map((s) => s.id))
      setSections(
        updated.map((item) => {
          const draft = reordered.find((section) => section.id === item.id)
          return draft ? { ...item, title: draft.title, caption: draft.caption } : item
        }),
      )
      onContentChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder sections.")
      await loadAll()
    }
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div className="admin-dashboard__header-copy">
          <p className="admin-dashboard__eyebrow">Portfolio editor</p>
          <h2>Admin dashboard</h2>
        </div>

        <div className="admin-dashboard__header-actions">
          <div className="admin-dashboard__stats" aria-label="Section summary">
            <span>
              <strong>{sections.length}</strong> sections
            </span>
            <span>
              <strong>{visibleSectionCount}</strong> visible
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="admin-dashboard__logout"
          >
            Log out
          </button>
          <button
            type="button"
            onClick={onClose}
            className="admin-dashboard__close"
            aria-label="Close admin dashboard"
          >
            ×
          </button>
        </div>
      </div>

      {error && <p className="admin-dashboard__error">{error}</p>}

      {loading ? (
        <p className="admin-dashboard__loading">Loading…</p>
      ) : (
        <div className="admin-dashboard__body">
          <section className="admin-dashboard__section">
            <div className="admin-dashboard__section-header">
              <h3>Site content</h3>
              <div className="admin-dashboard__section-header-actions">
                <span className="admin-dashboard__helper-text">Edit your public content in one place</span>
                <button
                  type="button"
                  className="admin-dashboard__collapse-toggle"
                  onClick={() => setSiteContentExpanded((current) => !current)}
                >
                  {siteContentExpanded ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            {site && siteContentExpanded && (
              <div className="admin-dashboard__site-form">
                <div className="admin-dashboard__save-bar">
                  <span>Changes are saved to the live site when you click save.</span>
                  <button
                    type="button"
                    onClick={handleSaveSite}
                    disabled={savingSite}
                    className="admin-dashboard__save"
                  >
                    {savingSite ? "Saving…" : "Save site content"}
                  </button>
                </div>

                {SITE_FIELDS.map((field) =>
                  field.multiline ? (
                    <label key={field.key}>
                      {field.label}
                      <textarea
                        value={site[field.key]}
                        onChange={(event) =>
                          handleSiteFieldChange(field.key, event.target.value)
                        }
                      />
                    </label>
                  ) : (
                    <label key={field.key}>
                      {field.label}
                      <input
                        type="text"
                        value={site[field.key]}
                        onChange={(event) =>
                          handleSiteFieldChange(field.key, event.target.value)
                        }
                      />
                    </label>
                  ),
                )}

                <div className="admin-dashboard__pricing-editor">
                  <h4>Pricing section</h4>
                  {PRICING_FIELDS.map((field) =>
                    field.multiline ? (
                      <label key={field.key}>
                        {field.label}
                        <textarea
                          value={site[field.key]}
                          onChange={(event) =>
                            handleSiteFieldChange(field.key, event.target.value)
                          }
                        />
                      </label>
                    ) : (
                      <label key={field.key}>
                        {field.label}
                        <input
                          type="text"
                          value={site[field.key]}
                          onChange={(event) =>
                            handleSiteFieldChange(field.key, event.target.value)
                          }
                        />
                      </label>
                    ),
                  )}

                  <div className="admin-dashboard__pricing-plans">
                    {(site.pricingPlans ?? []).map((plan, index) => (
                      <div key={`${plan.title}-${index}`} className="admin-dashboard__pricing-plan">
                        <label>
                          Plan number
                          <input
                            type="text"
                            value={plan.number}
                            onChange={(event) =>
                              updatePricingPlanField(index, "number", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Plan title
                          <input
                            type="text"
                            value={plan.title}
                            onChange={(event) =>
                              updatePricingPlanField(index, "title", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Description
                          <textarea
                            value={plan.description}
                            onChange={(event) =>
                              updatePricingPlanField(index, "description", event.target.value)
                            }
                          />
                        </label>
                        <div className="admin-dashboard__pricing-plan-row">
                          <label>
                            Price
                            <input
                              type="text"
                              value={plan.price}
                              onChange={(event) =>
                                updatePricingPlanField(index, "price", event.target.value)
                              }
                            />
                          </label>
                          <label>
                            Unit
                            <input
                              type="text"
                              value={plan.unit}
                              onChange={(event) =>
                                updatePricingPlanField(index, "unit", event.target.value)
                              }
                            />
                          </label>
                        </div>
                        <label>
                          Detail line
                          <input
                            type="text"
                            value={plan.detail}
                            onChange={(event) =>
                              updatePricingPlanField(index, "detail", event.target.value)
                            }
                          />
                        </label>
                        <label className="admin-dashboard__checkbox-row">
                          <input
                            type="checkbox"
                            checked={Boolean(plan.featured)}
                            onChange={(event) =>
                              updatePricingPlanField(index, "featured", event.target.checked)
                            }
                          />
                          Highlight this plan
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </section>

          <section className="admin-dashboard__section">
            <div className="admin-dashboard__section-header">
              <h3>Add a section</h3>
              <span className="admin-dashboard__helper-text">Use this form to create a new portfolio block</span>
            </div>

            <div className="admin-dashboard__new-section">
              <label>
                Title
                <input
                  type="text"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="e.g. Podcast Clips"
                />
              </label>

              <label>
                Description / caption
                <textarea
                  value={newCaption}
                  onChange={(event) => setNewCaption(event.target.value)}
                />
              </label>

              <label>
                Video file (optional for now)
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                  onChange={(event) => setNewVideoFile(event.target.files?.[0] ?? null)}
                />
              </label>

              <button
                type="button"
                onClick={handleCreateSection}
                disabled={creating || !newTitle.trim()}
                className="admin-dashboard__save"
              >
                {creating ? "Adding…" : "Add section"}
              </button>
            </div>
          </section>

          <section className="admin-dashboard__section">
            <div className="admin-dashboard__section-header">
              <h3>Sections ({sections.length})</h3>
              <div className="admin-dashboard__section-header-actions">
                <span className="admin-dashboard__helper-text">Drag rows or use the arrows to reorder them</span>
                <button
                  type="button"
                  className="admin-dashboard__collapse-toggle"
                  onClick={() => setSectionsExpanded((current) => !current)}
                >
                  {sectionsExpanded ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            {sectionsExpanded && (
              <ul className="admin-dashboard__sections-list">
                {sections.map((section, index) => (
                  <li
                    key={section.id}
                    className={`admin-section-row${draggedSectionId === section.id ? " is-dragging" : ""}`}
                    draggable
                    onDragStart={(event) => {
                      setDraggedSectionId(section.id)
                      event.dataTransfer.effectAllowed = "move"
                      event.dataTransfer.setData("text/plain", section.id)
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = "move"
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      void handleDropAtIndex(index)
                    }}
                    onDragEnd={() => setDraggedSectionId(null)}
                  >
                  <div className="admin-section-row__order">
                    <div
                      className="admin-section-row__handle"
                      aria-label="Drag to reorder section"
                      title="Drag to reorder"
                    >
                      <span aria-hidden="true">⋮⋮</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === sections.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>

                  <div className="admin-section-row__fields">
                    <div className="admin-section-row__meta">
                      <span className="admin-section-row__index">Section {index + 1}</span>
                      <span className={`admin-section-row__status ${section.isVisible ? "is-visible" : "is-hidden"}`}>
                        {section.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={section.title}
                      onChange={(event) =>
                        handleSectionFieldChange(section.id, "title", event.target.value)
                      }
                    />
                    <textarea
                      value={section.caption}
                      onChange={(event) =>
                        handleSectionFieldChange(section.id, "caption", event.target.value)
                      }
                    />

                    <div className="admin-section-row__video">
                      <span>{section.videoUrl ? "Video uploaded" : "No video yet"}</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) handleReplaceVideo(section.id, file)
                        }}
                      />
                    </div>
                  </div>

                  <div className="admin-section-row__actions">
                    <label className="admin-section-row__toggle">
                      <input
                        type="checkbox"
                        checked={section.isVisible}
                        onChange={() => handleToggleVisibility(section)}
                      />
                      Visible
                    </label>

                    <button
                      type="button"
                      onClick={() => handleSaveSection(section.id)}
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(section.id)}
                      className="admin-section-row__delete"
                    >
                      Delete
                    </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
