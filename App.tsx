import { useState, createContext, useContext, useCallback } from "react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Hero } from "@/components/landing/Hero"
import { Workflow } from "@/components/landing/Workflow"
import { Features } from "@/components/landing/Features"
import { WhySection } from "@/components/landing/WhySection"
import { Pricing } from "@/components/landing/Pricing"
import { EditorPage } from "@/components/editor/EditorPage"

type View = "landing" | "editor"

const VIEW_STORAGE_KEY = "wmf_view"

function getInitialView(): View {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY)
    if (saved === "editor" || saved === "landing") return saved
  } catch {
    // localStorage unavailable
  }
  return "landing"
}

interface NavigationContextType {
  navigateTo: (view: View) => void
}

const NavigationContext = createContext<NavigationContextType>({
  navigateTo: () => {},
})

export function useNavigation() {
  return useContext(NavigationContext)
}

export function App() {
  const [view, setView] = useState<View>(getInitialView)
  // Incremented each time the user navigates to the editor, forcing EditorPage to
  // remount with fresh state rather than carrying over settings from a prior session.
  const [editorKey, setEditorKey] = useState(0)

  const navigateTo = useCallback((v: View) => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, v)
    } catch {
      // localStorage unavailable
    }
    if (v === "editor") {
      setEditorKey((k) => k + 1)
    }
    setView(v)
    window.scrollTo(0, 0)
  }, [])

  if (view === "editor") {
    return (
      <NavigationContext.Provider value={{ navigateTo }}>
        <EditorPage key={editorKey} onNavigateHome={() => navigateTo("landing")} />
      </NavigationContext.Provider>
    )
  }

  return (
    <NavigationContext.Provider value={{ navigateTo }}>
      <div className="min-h-svh bg-background">
        <Header />
        <main>
          <Hero />
          <Workflow />
          <Features />
          <WhySection />
          <Pricing />
        </main>
        <Footer />
      </div>
    </NavigationContext.Provider>
  )
}

export default App
