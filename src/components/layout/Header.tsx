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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openAuthModal("sign-in")}
        disabled={loading}
      >
        Log In
      </Button>
      <Button
        size="sm"
        className="bg-primary hover:bg-primary/90"
        onClick={() => openAuthModal("sign-up")}
        disabled={loading}
      >
        Sign Up
      </Button>
    </div>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <a href="#" className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-primary via-primary to-emerald bg-clip-text text-transparent">
            Forge<span className="font-black">Stamp</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateTo("editor")}
          >
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
              <SheetTitle className="text-lg font-black tracking-tight bg-gradient-to-r from-primary via-primary to-emerald bg-clip-text text-transparent">
                ForgeStamp
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 p-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
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
                    className="bg-primary hover:bg-primary/90"
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
