import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { templatesApi, presentationsApi, BASE_URL } from '../api/client'
import { AppLayout } from '../components/Layout/AppLayout'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import type { PreviewResponse, Slide, TemplateListItem, Theme } from '../types'
import { Loader2, Sparkles, X, Copy, Search, ArrowUpRight, Plus } from 'lucide-react'

const SLIDE_W = 1280
const SLIDE_H = 720

function resolveThumbnail(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

// ── Card thumbnail ──────────────────────────────────────────────────────────
// Fills the parent thumbnail wrapper (position:relative, aspect-ratio:16/9,
// overflow:hidden). Does NOT set its own size — parent owns all geometry.
function PlaceholderThumbnail({ name }: { name: string }) {
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  const accent = `hsl(${hue}, 60%, 58%)`
  const bg = `hsl(${hue}, 18%, 11%)`
  const block = 'rgba(255,255,255,0.09)'
  const blockLight = 'rgba(255,255,255,0.05)'
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bg,
        padding: '13% 10% 10%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Accent pill */}
      <div style={{ width: 28, height: 3, borderRadius: 2, background: accent, marginBottom: '7%', flexShrink: 0 }} />
      {/* Title line */}
      <div style={{ width: '72%', height: '13%', borderRadius: 3, background: block, marginBottom: '3.5%', flexShrink: 0 }} />
      {/* Subtitle line */}
      <div style={{ width: '48%', height: '7%', borderRadius: 2, background: blockLight, marginBottom: '9%', flexShrink: 0 }} />
      {/* Content row */}
      <div style={{ display: 'flex', gap: '4%', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1.4, borderRadius: 4, background: block }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8%' }}>
          <div style={{ flex: 1, borderRadius: 3, background: blockLight }} />
          <div style={{ flex: 1, borderRadius: 3, background: blockLight }} />
          <div style={{ flex: 1, borderRadius: 3, background: blockLight }} />
        </div>
      </div>
    </div>
  )
}

function TemplateThumbnail({
  name,
  thumbnailUrl,
  previewSlide,
  theme,
}: {
  name: string
  thumbnailUrl: string
  previewSlide?: Slide | null
  theme?: Theme | null
}) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const resolved = resolveThumbnail(thumbnailUrl)
  const hasImage = !!resolved && !imgError
  const hasSlide = !!previewSlide

  // ref sits on the inset-0 fill div; clientWidth == parent's inner width
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.2)
  useLayoutEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const update = () => setScale(el.clientWidth / SLIDE_W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Prefer thumbnail image when available; fall back to live slide preview
  if (hasImage) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <PlaceholderThumbnail name={name} />
        <img
          src={resolved}
          alt={name}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
      </div>
    )
  }

  if (hasSlide) {
    return (
      <div
        ref={ref}
        style={{ position: 'absolute', inset: 0, background: '#0A0907', overflow: 'hidden' }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: SLIDE_W,
            height: SLIDE_H,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: 'center',
          }}
        >
          <SlidePreview slide={previewSlide!} theme={theme ?? undefined} scale={1} />
        </div>
      </div>
    )
  }

  // Pure styled placeholder as last resort
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <PlaceholderThumbnail name={name} />
    </div>
  )
}

// ── Preview modal ───────────────────────────────────────────────────────────
function TemplatePreviewModal({
  template,
  onClose,
}: {
  template: TemplateListItem
  onClose: () => void
}) {
  const navigate = useNavigate()

  const [slides, setSlides] = useState<Slide[]>([])
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'edit' | null>(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  useEffect(() => {
    setLoading(true)
    setError('')
    templatesApi.getPreview(template.id)
      .then((r) => {
        const data = r.data as PreviewResponse
        setSlides(data.slides ?? [])
        setTheme(data.theme ?? null)
      })
      .catch((err) => setError(err.response?.data?.detail ?? 'Failed to load preview'))
      .finally(() => setLoading(false))
  }, [template.id])

  const handleEditCopy = async () => {
    if (busy || !theme || slides.length === 0) return
    setBusy('edit')
    setActionError('')
    try {
      const { data } = await presentationsApi.create({
        title: `${template.name} (Copy)`,
        description: template.description ?? '',
        slides: slides as unknown as object[],
        theme_id: theme.id,
        template_id: template.id,
      })
      navigate(`/presentations/${(data as { id: string }).id}`)
    } catch (err: any) {
      setActionError(err.response?.data?.detail ?? 'Could not create copy')
      setBusy(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(10,9,7,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl h-full max-h-[92vh] rounded-3xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--paper)',
          boxShadow: '0 2px 4px rgba(15,14,12,0.08), 0 28px 56px -12px rgba(15,14,12,0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-8 py-6 flex items-start justify-between gap-4"
          style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--line)' }}
        >
          <div className="min-w-0">
            <p className="eyebrow mb-2">{template.category}</p>
            <h2
              className="font-serif text-[28px] leading-tight tracking-tighter"
              style={{ color: 'var(--ink-strong)' }}
            >
              {template.name}
            </h2>
            {template.description && (
              <p
                className="text-[13px] mt-1.5 max-w-xl line-clamp-2"
                style={{ color: 'var(--ink-soft)' }}
              >
                {template.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: 'var(--ink-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
              e.currentTarget.style.color = 'var(--ink-strong)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--ink-muted)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Slide gallery */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={22} style={{ color: 'var(--ink-muted)' }} className="animate-spin" />
              <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>Loading preview…</p>
            </div>
          )}

          {error && !loading && (
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: 'var(--accent-soft)', border: "1px solid var(--line)" }}
            >
              <p className="text-sm" style={{ color: 'var(--accent)' }}>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
              {slides.map((slide, idx) => (
                <SlidePreviewCard
                  key={slide.order ?? idx}
                  slide={slide}
                  theme={theme}
                  index={idx}
                  total={slides.length}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action footer */}
        <div
          className="flex-shrink-0 px-8 py-5 flex items-center justify-between gap-4"
          style={{ background: 'var(--paper-2)', borderTop: '1px solid var(--line)' }}
        >
          {actionError ? (
            <p className="text-[12.5px] flex-1" style={{ color: 'var(--accent)' }}>{actionError}</p>
          ) : (
            <p className="eyebrow flex-1">{slides.length} slides</p>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleEditCopy}
              disabled={busy !== null || loading || !theme}
              leadingIcon={<Copy size={13} />}
            >
              {busy === 'edit' ? 'Creating…' : 'Edit copy'}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const path = (template as any).slide_source === 'simple'
                  ? `/templates/${template.id}/use`
                  : `/templates/${template.id}/create`
                navigate(path)
              }}
              disabled={busy !== null || loading}
              leadingIcon={<Sparkles size={13} />}
              trailingIcon={<ArrowUpRight size={13} />}
            >
              Create from template
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Slide preview card (modal) ──────────────────────────────────────────────
function SlidePreviewCard({
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
  const [scale, setScale] = useState(0.6)

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
    <div className="flex flex-col gap-2.5">
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
          boxShadow: '0 1px 1px rgba(15,14,12,0.06), 0 12px 28px -8px rgba(15,14,12,0.16)',
          background: 'var(--paper-2)',
          border: '1px solid var(--line)',
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

type SourceFilter = 'all' | 'mine' | 'builtin'

// ── Templates page ──────────────────────────────────────────────────────────
export function TemplatesPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [previewing, setPreviewing] = useState<TemplateListItem | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')

  useEffect(() => {
    setLoading(true)
    templatesApi
      .list({ source: sourceFilter })
      .then((r) => setTemplates(r.data))
      .finally(() => setLoading(false))
  }, [sourceFilter])

  const openTemplate = (t: TemplateListItem) => {
    // Wizard-built templates use the simpler prompt-only flow.
    if ((t as any).slide_source === 'simple') {
      navigate(`/templates/${t.id}/use`)
    } else {
      navigate(`/templates/${t.id}/create`)
    }
  }

  const categories = useMemo(() => {
    const set = new Set<string>()
    templates.forEach((t) => t.category && set.add(t.category))
    return ['all', ...Array.from(set)]
  }, [templates])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return templates.filter((t) => {
      if (activeCategory !== 'all' && t.category !== activeCategory) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }, [templates, search, activeCategory])

  return (
    <AppLayout>
      <div className="px-8 pt-10 pb-20">

        {/* Page header */}
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="eyebrow mb-3">— The library</p>
            <h1
              className="font-serif leading-[1.05] tracking-tighter text-[34px] md:text-[44px]"
              style={{ color: 'var(--ink-strong)' }}
            >
              Templates
            </h1>
            <p
              className="text-[14px] mt-2 leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              Designed by humans, finished by AI. Pick one, paste your idea, get a deck.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/templates/new')}
            leadingIcon={<Plus size={13} />}
          >
            Create template
          </Button>
        </div>

        {/* Unified filter bar */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {/* Source filter */}
          {([
            { value: 'all', label: 'All' },
            { value: 'mine', label: 'Mine' },
            { value: 'builtin', label: 'Built-in' },
          ] as const).map((opt) => (
            <Chip
              key={opt.value}
              active={sourceFilter === opt.value}
              onClick={() => setSourceFilter(opt.value)}
            >
              {opt.label}
            </Chip>
          ))}

          {/* Divider */}
          <div
            className="w-px h-4 mx-1 flex-shrink-0"
            style={{ background: 'var(--line-strong)' }}
          />

          {/* Category chips — skip the 'all' sentinel; clicking active chip resets */}
          {categories.filter((cat) => cat !== 'all').map((cat) => (
            <Chip
              key={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat)}
            >
              {cat}
            </Chip>
          ))}

          {/* Spacer */}
          <div className="flex-1 min-w-[16px]" />

          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search
              size={13}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--ink-faint)' }}
            />
            <input
              type="text"
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-4 rounded-xl text-[13px] focus:outline-none transition-colors w-[220px]"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink-strong)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--ink-strong)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
            />
          </div>

          {/* Count */}
          <p className="eyebrow flex-shrink-0">{filtered.length} of {templates.length}</p>
        </div>

        {/* Grid */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="aspect-[16/9] rounded-2xl shimmer flex-shrink-0" />
                <div style={{ paddingTop: 20 }}>
                  <div className="h-5 w-2/3 mb-2 rounded shimmer" />
                  <div className="h-5 w-1/2 mb-3 rounded shimmer" />
                  <div className="h-3 w-1/3 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div
            className="rounded-2xl py-20 text-center"
            style={{ background: 'var(--surface)', border: '1px dashed var(--line-strong)' }}
          >
            <p
              className="font-serif text-[28px] leading-tight tracking-tighter mb-2"
              style={{ color: 'var(--ink-strong)' }}
            >
              No matches found
            </p>
            <p className="text-[14px]" style={{ color: 'var(--ink-soft)' }}>
              Try a different search or category.
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 items-start">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onView={() => setPreviewing(t)}
                onCreate={() => openTemplate(t)}
              />
            ))}
          </div>
        )}
      </div>

      {previewing && (
        <TemplatePreviewModal
          template={previewing}
          onClose={() => setPreviewing(null)}
        />
      )}
    </AppLayout>
  )
}

// ── Template card ───────────────────────────────────────────────────────────
function TemplateCard({
  template,
  onView,
  onCreate,
}: {
  template: TemplateListItem
  onView: () => void
  onCreate: () => void
}) {
  return (
    <div
      className="group"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* Thumbnail — locked 16:9, flex-shrink-0 so it never compresses */}
      <div
        onClick={onView}
        className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ease-out"
        style={{
          aspectRatio: '16 / 9',
          flexShrink: 0,
          boxShadow: '0 1px 1px rgba(15,14,12,0.05), 0 4px 12px -4px rgba(15,14,12,0.08)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            '0 1px 1px rgba(15,14,12,0.06), 0 16px 36px -10px rgba(15,14,12,0.20)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            '0 1px 1px rgba(15,14,12,0.05), 0 4px 12px -4px rgba(15,14,12,0.08)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <TemplateThumbnail
          name={template.name}
          thumbnailUrl={template.thumbnail_url}
          previewSlide={template.preview_slide ?? null}
          theme={template.theme ?? null}
        />

        {/* Hover actions — absolute inside thumbnail only, no layout impact */}
        <div className="absolute inset-x-0 bottom-0 p-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out">
          <button
            onClick={(e) => { e.stopPropagation(); onView() }}
            className="h-9 px-4 rounded-full text-[12.5px] font-semibold transition-colors"
            style={{
              background: 'rgba(255,255,255,0.95)',
              color: 'var(--ink-strong)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            Preview
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCreate() }}
            className="ml-auto h-9 px-4 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors"
            style={{
              background: 'var(--ink-strong)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <Sparkles size={12} />
            Use template
          </button>
        </div>
      </div>

      {/* Caption — always below thumbnail, flex column */}
      <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Title: fixed 2-line height aligns titles across every row.
            20px × 1.25 leading = 25px/line × 2 = 50px + 6px buffer */}
        <div style={{ height: 56, overflow: 'hidden', marginBottom: 8, flexShrink: 0 }}>
          <p
            className="font-serif text-[20px] leading-tight tracking-tighter line-clamp-2"
            style={{ color: 'var(--ink-strong)', margin: 0 }}
          >
            {template.name}
          </p>
        </div>

        {/* Description: fixed 2-line height aligns descriptions across every row.
            12.5px × 1.625 leading = 20.3px/line × 2 = 40.6px + 3px buffer */}
        <div style={{ height: 44, overflow: 'hidden', marginBottom: 16, flexShrink: 0 }}>
          <p
            className="text-[12.5px] leading-relaxed line-clamp-2"
            style={{ color: 'var(--ink-soft)', margin: 0 }}
          >
            {template.description ?? ''}
          </p>
        </div>

        {/* Meta — category · tag · slide count */}
        <div className="mt-auto flex items-center gap-3">
          <span className="eyebrow">{template.category}</span>
          {template.tags?.[0] && (
            <>
              <span
                className="w-0.5 h-0.5 rounded-full"
                style={{ background: 'var(--ink-faint)', flexShrink: 0 }}
              />
              <span
                className="font-serif-italic text-[12px]"
                style={{ color: 'var(--ink-muted)' }}
              >
                {template.tags[0]}
              </span>
            </>
          )}
          <span className="ml-auto eyebrow" style={{ flexShrink: 0 }}>
            {template.total_slides}p
          </span>
        </div>
      </div>
    </div>
  )
}
