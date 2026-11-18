import { useState } from "react"
import { Button } from "@/components/ui/button"

const SEEN = "fs-welcome-seen"
const STEPS = [
  {
    title: "Add a photo",
    body: "Drop in one photo, or a few. Nothing is uploaded until you choose to save.",
  },
  {
    title: "Stamp it",
    body: "Use Your Text, a logo, or a pattern. Move it, or cover the whole photo.",
  },
  {
    title: "Download",
    body: "Export when it looks right. You can come back and change the mark.",
  },
]

export function welcomeAlreadySeen(): boolean {
  try {
    return localStorage.getItem(SEEN) === "1"
  } catch {
    return true
  }
}

export function WelcomeTour() {
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(() => !welcomeAlreadySeen())
  if (!open) return null
  const current = STEPS[step]
  const finish = () => {
    try {
      localStorage.setItem(SEEN, "1")
    } catch {
      // The tour can still close for this visit.
    }
    setOpen(false)
  }
  return (
    <div
      data-panel="welcome"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-black/10 bg-white p-4 shadow-lg md:inset-x-auto md:right-6"
      role="dialog"
      aria-label="Welcome"
    >
      <p className="text-[11px] font-medium text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
      <h2 className="mt-1 text-base font-semibold">{current.title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{current.body}</p>
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="outline" className="min-h-10" onClick={finish}>
          Skip
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" className="min-h-10 flex-1" onClick={() => setStep(step + 1)}>
            Next
          </Button>
        ) : (
          <Button type="button" className="min-h-10 flex-1" onClick={finish}>
            Start stamping
          </Button>
        )}
      </div>
    </div>
  )
}
