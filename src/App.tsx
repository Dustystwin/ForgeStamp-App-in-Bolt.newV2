import { useState, createContext, useContext, useCallback } from "react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Hero } from "@/components/landing/Hero"
import { Workflow } from "@/components/landing/Workflow"
import { Features } from "@/components/landing/Features"
import { WhySection } from "@/components/landing/WhySection"
import { Pricing } from "@/components/landing/Pricing"
import { EditorPage } from "@/components/editor/EditorPage"
import { MyImagesPage } from "@/components/my-images/MyImagesPage"
import { AdminPage } from "@/components/admin/AdminPage"
import { AuthModal } from "@/components/auth/AuthModal"
import { AuthProvider } from "@/context/AuthContext"
import type { EditorState } from "@/lib/editor-types"

export type View = "landing" | "editor" | "my-images" | "admin"

export interface EditorInitialData {
  image: File
  settings: Partial<Omit<EditorState, "image" | "imagePreviewUrl" | "error">>
  sourceImageId?: string
}

interface NavigationContextType {
  navigateTo: (view: View, data?: { editorInitialData?: EditorInitialData }) => void
  openAuthModal: (defaultMode?: "sign-in" | "sign-up") => void
}

const NavigationContext = createContext<NavigationContextType>({
  navigateTo: () => {},
  openAuthModal: () => {},
})

export function useNavigation() {
  return useContext(NavigationContext)
}

const VIEW_STORAGE_KEY = "wmf_view"

function getInitialView(): View {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY)
    if (saved === "editor" || saved === "landing") return saved as View
  } catch {
    // localStorage unavailable
  }
  return "landing"
}

function AppInner() {
  const [view, setView] = useState<View>(getInitialView)
  const [editorKey, setEditorKey] = useState(0)
  const [editorInitialData, setEditorInitialData] = useState<EditorInitialData | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in")

  const navigateTo = useCallback(
    (v: View, data?: { editorInitialData?: EditorInitialData }) => {
      try {
        // Persist only basic views so refresh doesn't land on admin/my-images
        localStorage.setItem(VIEW_STORAGE_KEY, v === "editor" ? "editor" : "landing")
      } catch {
        // localStorage unavailable
      }
      if (v === "editor") {
        setEditorKey((k) => k + 1)
        setEditorInitialData(data?.editorInitialData ?? null)
      }
      setView(v)
      window.scrollTo(0, 0)
    },
    []
  )

  const openAuthModal = useCallback((defaultMode: "sign-in" | "sign-up" = "sign-in") => {
    setAuthModalMode(defaultMode)
    setAuthModalOpen(true)
  }, [])

  const renderView = () => {
    if (view === "editor") {
      return (
        <EditorPage
          key={editorKey}
          onNavigateHome={() => navigateTo("landing")}
          initialData={editorInitialData ?? undefined}
        />
      )
    }
    if (view === "my-images") {
      return <MyImagesPage />
    }
    if (view === "admin") {
      return <AdminPage />
    }
    return (
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
    )
  }

  return (
    <NavigationContext.Provider value={{ navigateTo, openAuthModal }}>
      {renderView()}
      <AuthModal
        open={authModalOpen}
        defaultMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </NavigationContext.Provider>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

export default App
