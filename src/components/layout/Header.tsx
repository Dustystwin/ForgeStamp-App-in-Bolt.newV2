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

export function Header() {
  const [open, setOpen] = useState(false)
  const { navigateTo } = useNavigation()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <a href="#" className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-primary via-primary to-emerald bg-clip-text text-transparent">
            Water<span className="font-black">Mint</span> Forge
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
            className="bg-primary hover:bg-primary/90"
            onClick={() => navigateTo("editor")}
          >
            Start Watermarking
          </Button>
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
                className="mt-4 bg-primary hover:bg-primary/90"
                onClick={() => {
                  setOpen(false)
                  navigateTo("editor")
                }}
              >
                Start Watermarking
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
