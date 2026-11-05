import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { NAV_LINKS } from "@/lib/constants"
import { useNavigation } from "@/App"
import { useAuth } from "@/context/AuthContext"
import { AccountMenu } from "@/components/auth/AccountMenu"

export function Header() {
  const [open, setOpen] = useState(false)
  const { navigateTo, openAuthModal } = useNavigation()
  const { session, loading } = useAuth()

  const authButtons = session ? (
    <AccountMenu />
  ) : (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => openAuthModal("sign-in")} disabled={loading}>
        Log In
      </Button>
      <Button size="sm" className="fs-btn-primary" onClick={() => openAuthModal("sign-up")} disabled={loading}>
        Sign Up
      </Button>
    </div>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-[var(--fs-cream)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <button
          type="button"
          className="flex items-center gap-2 bg-transparent p-0"
          onClick={() => navigateTo("landing")}
        >
          <span className="text-lg font-black tracking-tight fs-gradient-sunrise-text">
            Forge<span className="font-black">Stamp</span>
          </span>
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--fs-ink)]/65 transition-colors hover:text-[var(--fs-ink)]"
            >
              {link.label}
            </a>
          ))}
          <Button size="sm" variant="outline" className="border-[var(--fs-ink)]/15" onClick={() => navigateTo("editor")}>
            Start Watermarking
          </Button>
          {authButtons}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle className="text-lg font-black tracking-tight fs-gradient-sunrise-text">
                ForgeStamp
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 p-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-[var(--fs-ink)] transition-colors hover:fs-text-orange"
                >
                  {link.label}
                </a>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  navigateTo("editor")
                }}
              >
                Start Watermarking
              </Button>
              {session ? (
                <div onClick={() => setOpen(false)}>
                  <AccountMenu />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOpen(false)
                      openAuthModal("sign-in")
                    }}
                    disabled={loading}
                  >
                    Log In
                  </Button>
                  <Button
                    className="fs-btn-primary"
                    onClick={() => {
                      setOpen(false)
                      openAuthModal("sign-up")
                    }}
                    disabled={loading}
                  >
                    Sign Up Free
                  </Button>
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
