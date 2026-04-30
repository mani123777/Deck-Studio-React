import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import { templatesApi } from '../api/client'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import type { PreviewResponse, Slide, TemplateListItem, Theme } from '../types'

const SLIDE_W = 1280
const SLIDE_H = 720
const MAX_CHARS = 50000

const SUGGESTIONS = [
  'A new product launch deck',
  'Q3 2026 strategy review',
  'B2B SaaS sales pitch',
  'Early-stage investor pitch',
]

export function CreateFromTemplatePage() {
  const { id: templateId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [template, setTemplate] = useState<TemplateListItem | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [markdown, setMarkdown] = useState(true)
  const [cardCount, setCardCount] = useState<number>(5)

  useEffect(() => {
    if (!templateId) return
    setLoading(true)
    Promise.all([
      templatesApi.list(),
      templatesApi.getPreview(templateId),
    ])
      .then(([listRes, prevRes]) => {
        const t = (listRes.data as TemplateListItem[]).find((x) => x.id === templateId) ?? null
        setTemplate(t)
        const data = prevRes.data as PreviewResponse
        setSlides(data.slides ?? [])
        setTheme(data.theme ?? null)
      })
      .catch((e: any) => setLoadError(e?.response?.data?.detail ?? 'Failed to load template'))
      .finally(() => setLoading(false))
  }, [templateId])

  const charCount = prompt.length
  const canGenerate = !generating && prompt.trim().length > 0 && !!templateId

  const handleGenerate = async () => {
    if (!canGenerate || !templateId) return
    setGenerating(true)
    setGenError('')
    try {
      const { data } = await templatesApi.generateFromPrompt(templateId, prompt.trim(), undefined, cardCount)
      navigate(`/presentations/${(data as { id: string }).id}`)
    } catch (e: any) {
      setGenError(e?.response?.data?.detail ?? 'Generation failed. Please try again.')
      setGenerating(false)
    }
  }

  const onPromptKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{ background: 'rgba(244, 242, 238, 0.85)', borderBottom: '1px solid var(--line)' }}
      >
        <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 h-9 rounded-full text-[13px] transition-colors"
            style={{ color: 'var(--ink)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(10,9,7,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="text-center min-w-0">
            <p className="eyebrow mb-0.5">— New deck</p>
            <p
              className="font-serif text-[15px] truncate tracking-tighter"
              style={{ color: 'var(--ink-strong)' }}
            >
              {template?.name ?? '…'}
            </p>
          </div>
          <div className="w-[80px]" />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT — Prompt */}
        <div className="flex flex-col">
          {/* Editorial heading */}
          <div className="mb-8">
            <p className="eyebrow mb-4">— Write your prompt</p>
            <h1
              className="font-serif leading-[1.0] tracking-tightest text-[34px] md:text-[44px]"
              style={{ color: 'var(--ink-strong)' }}
            >
              What's the
              <br />
              <span className="font-serif-italic" style={{ color: 'var(--accent)' }}>deck about?</span>
            </h1>
            <p
              className="text-[14.5px] mt-5 max-w-md leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              Describe your topic, paste raw notes, or pick a starter. AI fills the template using your prompt — layout, colors, and rhythm stay intact.
            </p>
          </div>

          {/* Prompt card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              boxShadow: '0 1px 1px rgba(15,14,12,0.04), 0 4px 12px -4px rgba(15,14,12,0.08)',
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={onPromptKey}
              placeholder="A pitch deck for Acme Corp's new B2B analytics platform launching in Q3…"
              className="w-full min-h-[200px] p-6 text-[14.5px] focus:outline-none resize-none font-sans leading-relaxed"
              style={{ color: 'var(--ink-strong)', background: 'transparent' }}
            />

            {/* Suggestions */}
            <div className="px-5 pb-4 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] font-medium transition-all"
                  style={{ background: 'var(--surface-2)', color: 'var(--ink-soft)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
                    e.currentTarget.style.color = 'var(--ink-strong)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface-2)'
                    e.currentTarget.style.color = 'var(--ink-soft)'
                  }}
                >
                  <Sparkles size={11} style={{ color: 'var(--accent)' }} />
                  {s}
                </button>
              ))}
            </div>

            {/* Footer row */}
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--line)', background: 'var(--surface-2)' }}
            >
              <button
                onClick={() => setMarkdown((v) => !v)}
                className="flex items-center gap-1.5 text-[11.5px] font-mono uppercase tracking-wider transition-colors"
                style={{ color: markdown ? 'var(--ink)' : 'var(--ink-faint)' }}
              >
                <span
                  className="text-[10px] font-bold border rounded px-1 py-0.5"
                  style={{ borderColor: markdown ? 'var(--ink)' : 'var(--line-strong)' }}
                >M</span>
                Markdown
              </button>
              <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--ink-muted)' }}>
                {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Error */}
          {genError && (
            <div
              className="mt-4 rounded-xl px-4 py-3"
              style={{ background: 'var(--accent-soft)', border: "1px solid var(--line)" }}
            >
              <p className="text-[13px]" style={{ color: 'var(--accent)' }}>{genError}</p>
            </div>
          )}

          {/* Generate row */}
          <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <p className="eyebrow" style={{ margin: 0 }}>— Cards</p>
              <div
                className="inline-flex items-center p-1 rounded-full"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
              >
                {[5, 10, 15].map((n) => {
                  const active = cardCount === n
                  return (
                    <button
                      key={n}
                      onClick={() => setCardCount(n)}
                      className="h-8 min-w-[40px] px-3 rounded-full text-[12.5px] font-semibold transition-all tabular-nums"
                      style={{
                        background: active ? 'var(--ink-strong)' : 'transparent',
                        color: active ? '#fff' : 'var(--ink-soft)',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.color = 'var(--ink-strong)'
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.color = 'var(--ink-soft)'
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-full text-[14px] font-semibold transition-all"
              style={{
                background: canGenerate ? 'var(--ink-strong)' : 'rgba(10,9,7,0.15)',
                color: '#fff',
                cursor: canGenerate ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => {
                if (canGenerate) e.currentTarget.style.background = '#2A2620'
              }}
              onMouseLeave={(e) => {
                if (canGenerate) e.currentTarget.style.background = 'var(--ink-strong)'
              }}
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT — preview */}
        <div className="flex flex-col">
          <div className="mb-6">
            <p className="eyebrow mb-3">— The template</p>
            <h2
              className="font-serif text-[32px] leading-tight tracking-tightest"
              style={{ color: 'var(--ink-strong)' }}
            >
              {template?.name ?? 'Template'}
            </h2>
            {template?.description && (
              <p
                className="text-[13px] mt-2 line-clamp-2 max-w-md"
                style={{ color: 'var(--ink-soft)' }}
              >
                {template.description}
              </p>
            )}
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              boxShadow: '0 1px 1px rgba(15,14,12,0.04), 0 4px 12px -4px rgba(15,14,12,0.08)',
            }}
          >
            <div className="max-h-[calc(100vh-260px)] overflow-y-auto p-5 space-y-5">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 size={22} className="animate-spin" style={{ color: 'var(--ink-muted)' }} />
                  <p className="text-[12.5px]" style={{ color: 'var(--ink-soft)' }}>Loading template…</p>
                </div>
              )}
              {loadError && !loading && (
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'var(--accent-soft)', border: "1px solid var(--line)" }}
                >
                  <p className="text-[13px]" style={{ color: 'var(--accent)' }}>{loadError}</p>
                </div>
              )}
              {!loading && !loadError && slides.map((slide, idx) => (
                <SlideThumb
                  key={slide.order ?? idx}
                  slide={slide}
                  theme={theme}
                  index={idx}
                  total={slides.length}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SlideThumb({
  slide,
  theme,
  index,
  total,
}: {
  slide: Slide
  theme: Theme | null
  index: number
  total: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  useLayoutEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const update = () => setScale(el.clientWidth / SLIDE_W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <p className="eyebrow pl-0.5">
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </p>
      <div
        ref={ref}
        style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 1px 1px rgba(15,14,12,0.05), 0 12px 28px -8px rgba(15,14,12,0.16)',
          background: '#000',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: SLIDE_W,
            height: SLIDE_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <SlidePreview slide={slide} theme={theme ?? undefined} scale={1} />
        </div>
      </div>
    </div>
  )
}
