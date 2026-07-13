import { LogOut, Images, ShieldCheck, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/AuthContext"
import { useNavigation } from "@/App"

export function AccountMenu() {
  const { profile, signOut } = useAuth()
  const { navigateTo } = useNavigation()

  if (!profile) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 max-w-[180px]">
          <span className="truncate text-xs">{profile.email}</span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal text-xs text-muted-foreground truncate">
          {profile.email}
        </DropdownMenuLabel>
        {profile.tier === "pro" && (
          <DropdownMenuLabel className="font-semibold text-xs text-primary py-0 pb-1">
            Pro
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => navigateTo("my-images")}
        >
          <Images className="size-4" />
          My Images
        </DropdownMenuItem>
        {profile.is_admin && (
          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            onClick={() => navigateTo("admin")}
          >
            <ShieldCheck className="size-4" />
            Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          onClick={signOut}
        >
          <LogOut className="size-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
