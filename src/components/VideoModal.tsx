import { useEffect, useState } from "react"
import type { Section } from "../lib/api"
import { mediaUrl } from "../lib/api"

type VideoModalProps = {
  section: Section
  onClose: () => void
}

type Orientation = "landscape" | "portrait" | "square"

export function VideoModal({ section, onClose }: VideoModalProps) {
  const [orientation, setOrientation] = useState<Orientation>("landscape")

  // Close on Escape, from anywhere on the page.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const handleLoadedMetadata = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget
    const ratio = video.videoWidth / video.videoHeight

    if (ratio > 1.05) setOrientation("landscape")
    else if (ratio < 0.95) setOrientation("portrait")
    else setOrientation("square")
  }

  const videoSrc = mediaUrl(section.videoUrl)

  return (
    <div
      className="video-modal-overlay"
      onClick={onClose}
    >
      <div
        className={`video-modal video-modal--${orientation}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={section.title}
      >
        <button
          type="button"
          className="video-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="video-modal__media">
          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              autoPlay
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
            />
          ) : (
            <div className="video-modal__placeholder">Video coming soon.</div>
          )}
        </div>

        <div className="video-modal__info">
          <h3>{section.title}</h3>
          <p>{section.caption}</p>
        </div>
      </div>
    </div>
  )
}
