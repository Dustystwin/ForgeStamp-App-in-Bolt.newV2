// Deletes saved images after their 30-day expiry.
//
// Deploy from a machine logged into the Supabase CLI:
//   supabase functions deploy cleanup-expired-images --no-verify-jwt
//
// Then schedule it once a day. In the dashboard, open Edge Functions,
// select cleanup-expired-images, and add a schedule of: 0 3 * * *
// (every day at 03:00 UTC). The request must send
// Authorization: Bearer <service role key>
// The platform schedule does that. Do not put the service role key in the
// browser or in this repo. This function ignores any file list in the
// request and only removes rows already past expires_at.
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2"

const BUCKET = "watermark-images"
const BATCH = 100
const MAX_BATCHES = 20

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

function bearerMatches(header: string | null, secret: string): boolean {
  if (!header || !secret) return false
  const match = /^Bearer\s+(.+)$/i.exec(header)
  if (!match) return false
  const token = new TextEncoder().encode(match[1])
  const expected = new TextEncoder().encode(secret)
  if (token.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < token.length; i++) diff |= token[i] ^ expected[i]
  return diff === 0
}

type ImagePathRow = {
  id: string
  original_path: string | null
  output_path: string | null
}

async function pathsStillInUse(
  admin: SupabaseClient,
  paths: string[],
  nowIso: string,
): Promise<Set<string>> {
  const keep = new Set<string>()
  if (paths.length === 0) return keep

  const [originals, outputs] = await Promise.all([
    admin
      .from("images")
      .select("original_path")
      .gt("expires_at", nowIso)
      .in("original_path", paths),
    admin
      .from("images")
      .select("output_path")
      .gt("expires_at", nowIso)
      .in("output_path", paths),
  ])
  if (originals.error) throw new Error(originals.error.message)
  if (outputs.error) throw new Error(outputs.error.message)

  for (const row of originals.data ?? []) {
    if (row.original_path) keep.add(row.original_path)
  }
  for (const row of outputs.data ?? []) {
    if (row.output_path) keep.add(row.output_path)
  }
  return keep
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== "POST") return err("Method not allowed", 405)

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  if (!supabaseUrl || !bearerMatches(req.headers.get("Authorization"), serviceKey)) {
    return err("Unauthorized", 401)
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    let deletedImages = 0
    let deletedFiles = 0

    for (let batch = 0; batch < MAX_BATCHES; batch++) {
      const nowIso = new Date().toISOString()
      const { data, error } = await admin
        .from("images")
        .select("id, original_path, output_path")
        .lt("expires_at", nowIso)
        .order("expires_at", { ascending: true })
        .limit(BATCH)
      if (error) throw new Error(error.message)

      const expired = (data ?? []) as ImagePathRow[]
      if (expired.length === 0) {
        return json({ deletedImages, deletedFiles, more: false })
      }

      const paths = [
        ...new Set(
          expired.flatMap((row) => [row.original_path, row.output_path]).filter(
            (path): path is string => typeof path === "string" && path.length > 0,
          ),
        ),
      ]
      const keep = await pathsStillInUse(admin, paths, nowIso)
      const removable = paths.filter((path) => !keep.has(path))

      if (removable.length > 0) {
        const { error: storageError } = await admin.storage.from(BUCKET).remove(removable)
        if (storageError) throw new Error(storageError.message)
        deletedFiles += removable.length
      }

      const ids = expired.map((row) => row.id)
      const { data: removed, error: deleteError } = await admin
        .from("images")
        .delete()
        .in("id", ids)
        .select("id")
      if (deleteError) throw new Error(deleteError.message)
      if (!removed || removed.length === 0) {
        throw new Error("Expired image rows could not be deleted.")
      }
      deletedImages += removed.length

      if (expired.length < BATCH) {
        return json({ deletedImages, deletedFiles, more: false })
      }
    }

    return json({ deletedImages, deletedFiles, more: true })
  } catch (e) {
    console.error(e instanceof Error ? e.message : "Cleanup failed")
    return err("Cleanup failed", 500)
  }
})
