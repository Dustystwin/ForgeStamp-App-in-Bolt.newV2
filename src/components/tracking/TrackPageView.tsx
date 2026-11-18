import { useEffect, useState } from "react"
import { readPublicTrackPage, recordTrackScan, type TrackPage } from "@/lib/tracking"

export function TrackPageView({ slug }: { slug: string }) {
  const [page, setPage] = useState<TrackPage | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let gone = false
    readPublicTrackPage(slug).then((found) => {
      if (gone) return
      if (!found) setMissing(true)
      else setPage({ ...found })
    })
    void recordTrackScan(slug)
    return () => {
      gone = true
    }
  }, [slug])

  return (
    <main className="fs-studio min-h-svh px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ForgeStamp</p>
        {missing && (
          <p className="mt-3 text-sm leading-relaxed">
            This link is not ready yet. The photo tracking database update has not been applied.
          </p>
        )}
        {!missing && !page && <p className="mt-3 text-sm">Opening this page…</p>}
        {page && (
          <div className="mt-3 space-y-3">
            <h1 className="text-2xl font-semibold">{page.slug}</h1>
            {page.contact && <p className="text-sm">{page.contact}</p>}
            {page.shopUrl && (
              <a className="inline-flex min-h-10 items-center text-sm font-medium underline" href={page.shopUrl}>
                Shop
              </a>
            )}
            <ul className="space-y-1 text-sm">
              {Object.entries(page.socials).filter(([, value]) => value).map(([name, value]) => (
                <li key={name}><span className="capitalize">{name}</span>: {value}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
