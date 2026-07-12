import { ArrowRight, Play, Sparkles, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/layout/Section"
import { useNavigation } from "@/App"

export function Hero() {
  const { navigateTo } = useNavigation()

  return (
    <Section className="relative overflow-hidden pt-12 pb-12 md:pt-20 md:pb-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute -bottom-48 -left-32 h-[400px] w-[400px] rounded-full bg-accent/[0.06] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/[0.03] blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-balance md:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
          Create Professional Watermarks in Seconds.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg leading-relaxed">
          Protect your images with beautiful custom watermarks. Upload your image, customize your watermark, preview the results instantly, and export your protected image in just a few clicks.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20" onClick={() => navigateTo("editor")}>
            Start Watermarking
            <ArrowRight className="ml-1 size-4" />
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#how-it-works">
              <Play className="mr-1 size-4" />
              See How It Works
            </a>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3 text-primary/60" />
            No account needed to try
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="size-3 text-primary/60" />
            Live preview workflow
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Download className="size-3 text-primary/60" />
            Export ready images
          </span>
        </div>

        <div className="mt-10 w-full max-w-4xl">
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl shadow-primary/[0.03]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-accent/[0.02]" />

            <div className="relative">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-4 py-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald/40" />
                </div>
                <div className="ml-3 flex h-4 w-44 items-center rounded-sm bg-muted/40 px-2">
                  <span className="text-[8px] text-muted-foreground/50">ForgeStamp</span>
                </div>
              </div>

              <div className="grid md:grid-cols-[1fr_220px]">
                <div className="relative flex items-center justify-center p-6 md:p-10">
                  <div className="relative w-full aspect-[4/3] max-w-md rounded-lg bg-gradient-to-br from-primary/[0.06] via-amber/[0.04] to-accent/[0.06] border border-border/30 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.12]">
                      <div className="absolute top-[12%] left-[8%] h-24 w-36 rounded-md bg-primary/30" />
                      <div className="absolute bottom-[15%] right-[10%] h-20 w-28 rounded-md bg-accent/30" />
                      <div className="absolute top-[45%] right-[35%] h-14 w-14 rounded-full bg-amber/30" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="space-y-10 rotate-[-28deg]">
                        <p className="text-lg font-bold text-primary/20 tracking-[0.25em] md:text-xl whitespace-nowrap">
                          SAMPLE TEXT
                        </p>
                        <p className="text-lg font-bold text-primary/15 tracking-[0.25em] md:text-xl whitespace-nowrap translate-x-10">
                          SAMPLE TEXT
                        </p>
                        <p className="text-lg font-bold text-primary/20 tracking-[0.25em] md:text-xl whitespace-nowrap -translate-x-8">
                          SAMPLE TEXT
                        </p>
                      </div>
                    </div>

                    <div className="relative z-10 rounded bg-card/90 backdrop-blur-sm border border-border/30 px-2.5 py-1 shadow-sm">
                      <p className="text-[9px] text-muted-foreground font-medium">your-photo.png</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 bg-muted/[0.04] p-4 md:border-t-0 md:border-l md:border-border/40 space-y-2.5">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Text</p>
                    <div className="h-6 rounded border border-border/60 bg-background px-2 flex items-center">
                      <span className="text-[10px] text-foreground/50">SAMPLE TEXT</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Font</p>
                    <div className="h-6 rounded border border-border/60 bg-background px-2 flex items-center justify-between">
                      <span className="text-[10px] text-foreground/50">Inter Bold</span>
                      <span className="text-[8px] text-muted-foreground/40">&#9662;</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Opacity</p>
                    <div className="h-1 w-full rounded-full bg-border/60">
                      <div className="h-1 w-[65%] rounded-full bg-gradient-to-r from-primary/60 to-primary" />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[8px] text-muted-foreground/50">0%</span>
                      <span className="text-[8px] text-primary/80 font-medium">65%</span>
                      <span className="text-[8px] text-muted-foreground/50">100%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Rotation</p>
                    <div className="h-1 w-full rounded-full bg-border/60">
                      <div className="h-1 w-[40%] rounded-full bg-gradient-to-r from-accent/60 to-accent" />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[8px] text-muted-foreground/50">0&deg;</span>
                      <span className="text-[8px] text-accent/80 font-medium">-28&deg;</span>
                      <span className="text-[8px] text-muted-foreground/50">360&deg;</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Color</p>
                    <div className="flex gap-1">
                      <div className="h-4 w-4 rounded-sm border border-border/40 bg-primary ring-1 ring-primary/30 ring-offset-1 ring-offset-card" />
                      <div className="h-4 w-4 rounded-sm border border-border/40 bg-foreground/70" />
                      <div className="h-4 w-4 rounded-sm border border-border/40 bg-emerald" />
                      <div className="h-4 w-4 rounded-sm border border-border/40 bg-accent" />
                      <div className="h-4 w-4 rounded-sm border border-border/40 bg-muted-foreground/25" />
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Placement</p>
                    <div className="grid grid-cols-3 gap-px w-12 h-12">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className={`rounded-[2px] border border-border/40 ${i === 4 ? "bg-primary/15 border-primary/30" : "bg-muted/20"}`} />
                      ))}
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <div className="h-6 rounded bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
                      <span className="text-[9px] font-semibold text-primary-foreground tracking-wide">Export PNG</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
