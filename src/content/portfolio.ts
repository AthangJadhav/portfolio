export type PortfolioVideo = {
  id: number
  editNote: string
}

export type PortfolioCategory = {
  title: string
  description: string
  videos: PortfolioVideo[]
}

export const categories: PortfolioCategory[] = [
  {
    title: "Podcast Clips",
    description:
      "Turning long-form podcast recordings into sharp, scroll-stopping shorts — clean cuts, styled captions, and B-roll inserted where it earns attention.",
    videos: [
      {
        id: 1,
        editNote:
          "Podcast short — final edit with pacing, captions, cuts, and supporting visual treatment.",
      },
    ],
  },
  {
    title: "Vlogs",
    description:
      "Narrative-driven edits with paced storytelling, music timing, and transitions that keep a vlog watchable from start to finish.",
    videos: [
      {
        id: 4,
        editNote:
          "Vlog edit — structured the footage around pacing, transitions, music timing, and visual continuity.",
      },
    ],
  },
  {
    title: "Talking Head / Faceless Shorts",
    description:
      "Retention-first editing — strong hooks, pattern-interrupt cuts, and text overlays built to hold attention past the first three seconds.",
    videos: [
      {
        id: 6,
        editNote:
          "Short-form edit — tightened pacing and used cuts, captions, and visual changes to maintain attention.",
      },
    ],
  },
  {
    title: "Before / After",
    description:
      "The same raw clip, side by side with the final edit — showing exactly what editing adds.",
    videos: [],
  },
]