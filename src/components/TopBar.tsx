import { useRef } from "react"

type TopBarProps = {
  onAdminTrigger: () => void
}

const TRIPLE_CLICK_WINDOW_MS = 2000

export function TopBar({ onAdminTrigger }: TopBarProps) {
  const clickTimestamps = useRef<number[]>([])

  const handleLogoClick = () => {
    const now = Date.now()
    const recent = clickTimestamps.current.filter((timestamp) => now - timestamp < TRIPLE_CLICK_WINDOW_MS)
    recent.push(now)
    clickTimestamps.current = recent
    if (recent.length >= 3) {
      clickTimestamps.current = []
      onAdminTrigger()
    }
  }

  return (
    <header className="top-bar">
      <button type="button" className="top-bar__brand" onClick={handleLogoClick} aria-label="Athang Jadhav admin access">AJ<span>.</span></button>
      <div className="top-bar__descriptor"><span className="top-bar__descriptor-line" />VIDEO EDITOR</div>
    </header>
  )
}
