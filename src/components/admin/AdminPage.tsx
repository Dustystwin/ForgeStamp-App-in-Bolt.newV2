import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Users, Images, HardDrive, TrendingUp, ShieldCheck, Loader as Loader2, Trash2, Ban, CircleCheck as CheckCircle, ChevronDown, ChevronUp, Activity } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { useNavigation } from "@/App"
import { cn } from "@/lib/utils"

const ADMIN_API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`

async function adminFetch(path: string, opts: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const res = await fetch(`${ADMIN_API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? "Request failed")
  }
  return res.json()
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

interface Stats {
  totalUsers: number
  totalActiveImages: number
  totalStorageBytes: number
  signupsPerDay: { date: string; count: number }[]
  exportsPerDay: { date: string; count: number }[]
}

interface AdminUser {
  id: string
  email: string
  banned: boolean
  created_at: string
  tier: string
  is_admin: boolean
  image_count: number
  storage_bytes: number
}

interface AdminImage {
  id: string
  user_id: string
  filename: string
  total_size: number
  created_at: string
  expires_at: string
  // owner email resolved client-side
  owner_email?: string
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function AdminPage() {
  const { session, profile, loading: authLoading } = useAuth()
  const { navigateTo } = useNavigation()

  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [images, setImages] = useState<AdminImage[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingImages, setLoadingImages] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [chartType, setChartType] = useState<"signups" | "exports">("signups")
  const [usersExpanded, setUsersExpanded] = useState(true)
  const [imagesExpanded, setImagesExpanded] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!session || !profile?.is_admin) {
      navigateTo("landing")
    }
  }, [authLoading, session, profile, navigateTo])

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const data = await adminFetch("/stats")
      setStats(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load stats.")
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const data = await adminFetch("/users")
      setUsers(data.users ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load users.")
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  const loadImages = useCallback(async () => {
    setLoadingImages(true)
    try {
      const { data, error } = await supabase
        .from("images")
        .select("id, user_id, filename, total_size, created_at, expires_at")
        .order("created_at", { ascending: false })
        .limit(50)
      if (error) throw new Error(error.message)
      setImages((data as AdminImage[]) ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load images.")
    } finally {
      setLoadingImages(false)
    }
  }, [])

  useEffect(() => {
    if (!profile?.is_admin) return
    loadStats()
    loadUsers()
    loadImages()
  }, [profile, loadStats, loadUsers, loadImages])

  const handleSetTier = useCallback(async (userId: string, tier: "free" | "pro") => {
    setActionId(userId)
    try {
      await adminFetch("/set-tier", {
        method: "POST",
        body: JSON.stringify({ userId, tier }),
      })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, tier } : u))
      toast.success(`Tier updated to ${tier}.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update tier.")
    } finally {
      setActionId(null)
    }
  }, [])

  const handleBan = useCallback(async (userId: string, ban: boolean) => {
    setActionId(userId)
    try {
      await adminFetch(ban ? "/ban-user" : "/unban-user", {
        method: "POST",
        body: JSON.stringify({ userId }),
      })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, banned: ban } : u))
      toast.success(ban ? "User disabled." : "User enabled.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update user.")
    } finally {
      setActionId(null)
    }
  }, [])

  const handleDeleteUserImages = useCallback(async (userId: string) => {
    setActionId(`del-imgs-${userId}`)
    try {
      await adminFetch("/delete-user-images", {
        method: "POST",
        body: JSON.stringify({ userId }),
      })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, image_count: 0, storage_bytes: 0 } : u))
      setImages((prev) => prev.filter((i) => i.user_id !== userId))
      toast.success("User's images deleted.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete images.")
    } finally {
      setActionId(null)
    }
  }, [])

  const handleDeleteImage = useCallback(async (id: string) => {
    setActionId(`img-${id}`)
    try {
      await adminFetch(`/images/${id}`, { method: "DELETE" })
      setImages((prev) => prev.filter((i) => i.id !== id))
      toast.success("Image deleted.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete image.")
    } finally {
      setActionId(null)
    }
  }, [])

  // Build email lookup for images table
  const emailMap = Object.fromEntries(users.map((u) => [u.id, u.email]))

  if (authLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile?.is_admin) return null

  const chartData = chartType === "signups" ? stats?.signupsPerDay : stats?.exportsPerDay

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo("landing")}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Home
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <span className="text-sm font-bold">Admin Dashboard</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-6">

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loadingStats ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))
          ) : (
            <>
              <StatCard
                icon={<Users className="size-5" />}
                label="Total Users"
                value={stats?.totalUsers ?? 0}
              />
              <StatCard
                icon={<Images className="size-5" />}
                label="Active Images"
                value={stats?.totalActiveImages ?? 0}
                sub="within 30-day window"
              />
              <StatCard
                icon={<HardDrive className="size-5" />}
                label="Storage Used"
                value={formatBytes(stats?.totalStorageBytes ?? 0)}
                sub="active images only"
              />
            </>
          )}
        </div>

        {/* Chart */}
        <div className="rounded-xl border border-border/40 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Activity — last 30 days</h2>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border/40 p-0.5 text-xs">
              <button
                className={cn(
                  "rounded px-2.5 py-1 font-medium transition-colors",
                  chartType === "signups" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setChartType("signups")}
              >
                Sign-ups
              </button>
              <button
                className={cn(
                  "rounded px-2.5 py-1 font-medium transition-colors",
                  chartType === "exports" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setChartType("exports")}
              >
                Exports
              </button>
            </div>
          </div>
          {loadingStats ? (
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData ?? []} barSize={6}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: string) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
          <button
            className="flex w-full items-center justify-between px-5 py-3.5 border-b border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors"
            onClick={() => setUsersExpanded((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Users</h2>
              {!loadingUsers && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {users.length}
                </span>
              )}
            </div>
            {usersExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          {usersExpanded && (
            loadingUsers ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/30 bg-muted/10">
                    <tr className="text-left text-xs font-medium text-muted-foreground">
                      <th className="px-4 py-2.5">Email</th>
                      <th className="px-4 py-2.5">Tier</th>
                      <th className="px-4 py-2.5">Images</th>
                      <th className="px-4 py-2.5">Storage</th>
                      <th className="px-4 py-2.5">Joined</th>
                      <th className="px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className={cn("border-b border-border/20 hover:bg-muted/10 transition-colors", u.banned && "opacity-50")}>
                        <td className="px-4 py-2.5 font-medium text-xs max-w-[200px] truncate">
                          {u.email}
                          {u.is_admin && (
                            <span className="ml-1.5 rounded bg-primary/10 px-1 py-0.5 text-[9px] font-semibold text-primary">
                              admin
                            </span>
                          )}
                          {u.banned && (
                            <span className="ml-1.5 rounded bg-destructive/10 px-1 py-0.5 text-[9px] font-semibold text-destructive">
                              banned
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs capitalize">{u.tier}</td>
                        <td className="px-4 py-2.5 text-xs">{u.image_count}</td>
                        <td className="px-4 py-2.5 text-xs">{formatBytes(u.storage_bytes)}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[10px]"
                              disabled={actionId === u.id}
                              onClick={() => handleSetTier(u.id, u.tier === "pro" ? "free" : "pro")}
                            >
                              {actionId === u.id ? <Loader2 className="size-3 animate-spin" /> : (
                                u.tier === "pro" ? "→ Free" : "→ Pro"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-7 px-2 text-[10px]",
                                u.banned ? "text-emerald-600 border-emerald-300 hover:bg-emerald-50" : "text-destructive border-destructive/30 hover:bg-destructive/5"
                              )}
                              disabled={actionId === u.id}
                              onClick={() => handleBan(u.id, !u.banned)}
                            >
                              {u.banned ? <CheckCircle className="size-3" /> : <Ban className="size-3" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive border-destructive/30 hover:bg-destructive/5"
                              disabled={actionId === `del-imgs-${u.id}`}
                              onClick={() => handleDeleteUserImages(u.id)}
                              title="Delete all images"
                            >
                              {actionId === `del-imgs-${u.id}` ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No users yet.</p>
                )}
              </div>
            )
          )}
        </div>

        {/* Recent images */}
        <div className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
          <button
            className="flex w-full items-center justify-between px-5 py-3.5 border-b border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors"
            onClick={() => setImagesExpanded((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <Images className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Recent Images</h2>
              {!loadingImages && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {images.length}
                </span>
              )}
            </div>
            {imagesExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          {imagesExpanded && (
            loadingImages ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/30 bg-muted/10">
                    <tr className="text-left text-xs font-medium text-muted-foreground">
                      <th className="px-4 py-2.5">File</th>
                      <th className="px-4 py-2.5">Owner</th>
                      <th className="px-4 py-2.5">Size</th>
                      <th className="px-4 py-2.5">Created</th>
                      <th className="px-4 py-2.5">Expires</th>
                      <th className="px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {images.map((img) => {
                      const days = Math.max(0, Math.ceil((new Date(img.expires_at).getTime() - Date.now()) / 86400000))
                      return (
                        <tr key={img.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-2.5 text-xs font-medium max-w-[180px] truncate" title={img.filename}>
                            {img.filename}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[160px] truncate">
                            {emailMap[img.user_id] ?? img.user_id.slice(0, 8) + "..."}
                          </td>
                          <td className="px-4 py-2.5 text-xs">{formatBytes(img.total_size)}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">
                            {new Date(img.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2.5 text-xs">
                            <span className={cn(
                              "rounded-full px-2 py-0.5 font-medium",
                              days <= 5 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                            )}>
                              {days}d
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive border-destructive/30 hover:bg-destructive/5"
                              disabled={actionId === `img-${img.id}`}
                              onClick={() => handleDeleteImage(img.id)}
                            >
                              {actionId === `img-${img.id}` ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {images.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No images yet.</p>
                )}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  )
}
