import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status)
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return err("Missing authorization", 401)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!

    // Verify the caller's JWT using the anon client (respects RLS)
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !user) return err("Unauthorized", 401)

    // Check admin status using the service-role client (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceKey)
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile?.is_admin) return err("Forbidden", 403)

    const url = new URL(req.url)
    const path = url.pathname.replace(/^\/admin-api/, "")

    // GET /stats — returns sign-up counts per day (last 30 days)
    if (req.method === "GET" && path === "/stats") {
      const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      const users = authUsers?.users ?? []

      // Sign-ups per day (last 30 days)
      const now = Date.now()
      const dayMs = 86400000
      const buckets: Record<string, number> = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now - i * dayMs)
        buckets[d.toISOString().slice(0, 10)] = 0
      }
      for (const u of users) {
        const day = new Date(u.created_at).toISOString().slice(0, 10)
        if (day in buckets) buckets[day] = (buckets[day] ?? 0) + 1
      }
      const signupsPerDay = Object.entries(buckets).map(([date, count]) => ({ date, count }))

      // Images stats
      const { data: imgStats } = await adminClient
        .from("images")
        .select("created_at, total_size, expires_at")
      const imageRows = imgStats ?? []

      const exportsPerDay: Record<string, number> = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now - i * dayMs)
        exportsPerDay[d.toISOString().slice(0, 10)] = 0
      }
      let totalStorageBytes = 0
      let totalActiveImages = 0
      for (const row of imageRows) {
        const day = new Date(row.created_at).toISOString().slice(0, 10)
        if (day in exportsPerDay) exportsPerDay[day] = (exportsPerDay[day] ?? 0) + 1
        if (new Date(row.expires_at).getTime() > now) {
          totalActiveImages++
          totalStorageBytes += row.total_size ?? 0
        }
      }
      const exportsPerDayArr = Object.entries(exportsPerDay).map(([date, count]) => ({ date, count }))

      return json({
        totalUsers: users.length,
        totalActiveImages,
        totalStorageBytes,
        signupsPerDay,
        exportsPerDay: exportsPerDayArr,
      })
    }

    // GET /users — returns list of all users with aggregated image stats
    if (req.method === "GET" && path === "/users") {
      const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      const users = authUsers?.users ?? []

      const { data: profiles } = await adminClient.from("profiles").select("*")
      const { data: imageCounts } = await adminClient
        .from("images")
        .select("user_id, total_size")

      const profileMap: Record<string, { tier: string; is_admin: boolean }> = {}
      for (const p of profiles ?? []) {
        profileMap[p.id] = { tier: p.tier, is_admin: p.is_admin }
      }

      const imageStats: Record<string, { count: number; size: number }> = {}
      for (const img of imageCounts ?? []) {
        if (!imageStats[img.user_id]) imageStats[img.user_id] = { count: 0, size: 0 }
        imageStats[img.user_id].count++
        imageStats[img.user_id].size += img.total_size ?? 0
      }

      const result = users.map((u) => ({
        id: u.id,
        email: u.email,
        banned: u.banned_until != null && new Date(u.banned_until) > new Date(),
        created_at: u.created_at,
        tier: profileMap[u.id]?.tier ?? "free",
        is_admin: profileMap[u.id]?.is_admin ?? false,
        image_count: imageStats[u.id]?.count ?? 0,
        storage_bytes: imageStats[u.id]?.size ?? 0,
      }))

      return json({ users: result })
    }

    // POST /set-tier — change a user's tier
    if (req.method === "POST" && path === "/set-tier") {
      const { userId, tier } = await req.json()
      if (!userId || !["free", "pro"].includes(tier)) return err("Invalid params")
      const { error } = await adminClient
        .from("profiles")
        .update({ tier })
        .eq("id", userId)
      if (error) return err(error.message)
      return json({ success: true })
    }

    // POST /ban-user
    if (req.method === "POST" && path === "/ban-user") {
      const { userId } = await req.json()
      if (!userId) return err("Missing userId")
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: "876000h",
      })
      if (error) return err(error.message)
      return json({ success: true })
    }

    // POST /unban-user
    if (req.method === "POST" && path === "/unban-user") {
      const { userId } = await req.json()
      if (!userId) return err("Missing userId")
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: "none",
      })
      if (error) return err(error.message)
      return json({ success: true })
    }

    // POST /delete-user-images
    if (req.method === "POST" && path === "/delete-user-images") {
      const { userId } = await req.json()
      if (!userId) return err("Missing userId")

      const { data: imgs } = await adminClient
        .from("images")
        .select("original_path, output_path")
        .eq("user_id", userId)

      if (imgs && imgs.length > 0) {
        const paths = imgs.flatMap((i) => [i.original_path, i.output_path])
        await adminClient.storage.from("watermark-images").remove(paths)
        await adminClient.from("images").delete().eq("user_id", userId)
      }

      return json({ success: true })
    }

    // DELETE /images/:id
    if (req.method === "DELETE" && path.startsWith("/images/")) {
      const imageId = path.replace("/images/", "")
      const { data: img } = await adminClient
        .from("images")
        .select("original_path, output_path")
        .eq("id", imageId)
        .maybeSingle()
      if (img) {
        await adminClient.storage.from("watermark-images").remove([img.original_path, img.output_path])
        await adminClient.from("images").delete().eq("id", imageId)
      }
      return json({ success: true })
    }

    return err("Not found", 404)
  } catch (e) {
    console.error(e)
    return err(e instanceof Error ? e.message : "Internal error", 500)
  }
})
