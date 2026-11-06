import type { Section } from "../lib/api"

type WorkSidebarProps = {
  sections: Section[]
  onSelect: (section: Section) => void
}

export function WorkSidebar({ sections, onSelect }: WorkSidebarProps) {
  return (
    <nav
      className="work-sidebar"
      aria-label="Work index"
    >
      <div className="work-sidebar__header">
        <h3>WORK</h3>
        <p>Click to view</p>
      </div>

      <ul className="work-sidebar__list">
        {sections.length === 0 ? (
          <li className="work-sidebar__empty">More coming soon.</li>
        ) : (
          sections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onSelect(section)}
              >
                {section.title}
              </button>
            </li>
          ))
        )}
      </ul>
    </nav>
  )
}
