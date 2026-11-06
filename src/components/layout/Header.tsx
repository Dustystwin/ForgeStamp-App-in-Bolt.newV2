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
import { BrandMark } from "@/components/layout/BrandMark"

export function Header() {
  const [open, setOpen] = useState(false)
  const { navigateTo, openAuthModal } = useNavigation()
  const { session, loading } = useAuth()

  const authButtons = session ? (
    <AccountMenu />
  ) : (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-black/5 hover:text-[var(--fs-ink)]"
        onClick={() => openAuthModal("sign-in")}
        disabled={loading}
      >
        Log In
      </Button>
      <Button size="sm" className="fs-btn-primary shadow-none" onClick={() => openAuthModal("sign-up")} disabled={loading}>
        Sign Up
      </Button>
    </div>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-[var(--fs-cream)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <button
          type="button"
          className="flex min-h-11 items-center bg-transparent p-0"
          onClick={() => navigateTo("landing")}
        >
          <BrandMark />
        </button>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium fs-text-soft hover:text-[var(--fs-ink)]"
            >
              {link.label}
            </a>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="border-black/15 bg-transparent shadow-none hover:bg-white hover:text-[var(--fs-ink)]"
            onClick={() => navigateTo("editor")}
          >
            Try a watermark
          </Button>
          {authButtons}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="size-11 hover:bg-black/5 lg:hidden">
              <Menu />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="fs-landing w-full sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>
                <BrandMark />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 p-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center text-base font-medium text-[var(--fs-ink)]"
                >
                  {link.label}
                </a>
              ))}
              <Button
                variant="outline"
                className="h-11 min-h-11 border-black/15 bg-transparent shadow-none hover:bg-white hover:text-[var(--fs-ink)]"
                onClick={() => {
                  setOpen(false)
                  navigateTo("editor")
                }}
              >
                Try a watermark
              </Button>
              {session ? (
                <div onClick={() => setOpen(false)}>
                  <AccountMenu />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="h-11 min-h-11 border-black/15 bg-transparent shadow-none hover:bg-white hover:text-[var(--fs-ink)]"
                    onClick={() => {
                      setOpen(false)
                      openAuthModal("sign-in")
                    }}
                    disabled={loading}
                  >
                    Log In
                  </Button>
                  <Button
                    className="fs-btn-primary h-11 min-h-11 shadow-none"
                    onClick={() => {
                      setOpen(false)
                      openAuthModal("sign-up")
                    }}
                    disabled={loading}
                  >
                    Sign Up
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
