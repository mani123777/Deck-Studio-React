import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { presentationsApi, templatesApi } from '../api/client'
import { AppLayout } from '../components/Layout/AppLayout'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import type { PresentationListItem, TemplateListItem } from '../types'
import { MoreHorizontal, Sparkles, ArrowUpRight, FilePlus, FileUp, Wand2 } from 'lucide-react'
import { ImportModal } from '../components/Dashboard/ImportModal'

const SLIDE_W = 1280
const SLIDE_H = 720

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [presentations, setPresentations] = useState<PresentationListItem[]>([])
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    Promise.all([presentationsApi.list(), templatesApi.list()])
      .then(([pRes, tRes]) => {
        setPresentations(pRes.data)
        setTemplates(tRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this presentation?')) return
    await presentationsApi.delete(id)
    setPresentations((ps) => ps.filter((p) => p.id !== id))
    setOpenMenu(null)
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const heroTemplates = templates.slice(0, 3)
  const totalSlides = presentations.reduce((s, p) => s + (p.total_slides ?? 0), 0)

  const AI_PROMPTS = [
    'Pitch deck for a Series A startup',
    'Q3 business review for leadership',
    'Product launch overview for the team',
  ]

  return (
    <AppLayout>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}

      <div
        className="grid grid-cols-1 xl:grid-cols-[1fr_380px] min-h-screen"
        style={{
          background: 'radial-gradient(ellipse 70% 40% at 70% 0%, rgba(120,100,60,0.05) 0%, transparent 55%), var(--paper)',
        }}
      >
        {/* ── Main content ── */}
        <div className="min-w-0 px-8 md:px-10 xl:px-12 pt-12 pb-24">

          {/* Hero */}
          <div className="pb-10" style={{ borderBottom: '1px solid var(--line)' }}>
            <p className="eyebrow mb-4">{greeting}</p>
            <h1
              className="font-serif leading-[0.97] tracking-tighter mb-5"
              style={{ fontSize: 'clamp(38px, 4vw, 58px)', color: 'var(--ink-strong)' }}
            >
              Great slides start
              <br />
              <span className="font-serif-italic" style={{ color: 'var(--ink-muted)' }}>
                with a good idea.
              </span>
            </h1>
            <p
              className="text-[15px] leading-[1.7] max-w-[380px]"
              style={{ color: 'var(--ink-soft)' }}
            >
              Turn prompts, docs, and ideas into polished presentations — in seconds.
            </p>
          </div>

          {/* Quick start */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            <StartCard
              icon={<Wand2 size={15} />}
              title="Create with AI"
              description="Describe your topic and let AI build the deck."
              onClick={() => navigate('/create')}
              primary
            />
            <StartCard
              icon={<FilePlus size={15} />}
              title="Browse templates"
              description="Start from a hand-designed layout."
              onClick={() => navigate('/templates')}
            />
            <StartCard
              icon={<FileUp size={15} />}
              title="Import a PPTX"
              description="Bring an existing PowerPoint into Deck Studio."
              onClick={() => setShowImport(true)}
            />
          </div>

          {/* Recent decks */}
          <div className="mt-16">
            <SectionHeader
              eyebrow="Your work"
              title="Recent decks"
              actionLabel="All decks"
              onAction={() => navigate('/decks')}
            />

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="aspect-[16/9] rounded-2xl shimmer mb-4" />
                    <div className="h-4 w-2/3 mb-2 rounded shimmer" />
                    <div className="h-3 w-1/3 rounded shimmer" />
                  </div>
                ))}
              </div>
            )}

            {!loading && presentations.length === 0 && (
              <div
                className="rounded-2xl px-10 py-14 text-center"
                style={{ background: 'var(--surface)', border: '1.5px dashed var(--line-strong)' }}
              >
                <p
                  className="font-sans font-semibold text-[22px] leading-tight tracking-tight mb-2.5"
                  style={{ color: 'var(--ink-strong)' }}
                >
                  Your canvas is ready.
                </p>
                <p
                  className="text-[13.5px] mb-7 max-w-[260px] mx-auto leading-relaxed"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  Create your first deck from a prompt or template.
                </p>
                <button
                  onClick={() => navigate('/create')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Sparkles size={13} />
                  Generate with AI
                </button>
              </div>
            )}

            {!loading && presentations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                {presentations.slice(0, 6).map((p) => (
                  <DeckCard
                    key={p.id}
                    p={p}
                    menuOpen={openMenu === p.id}
                    onToggleMenu={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                    onCloseMenu={() => setOpenMenu(null)}
                    onOpen={() => navigate(`/presentations/${p.id}`)}
                    onDelete={() => handleDelete(p.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Featured templates */}
          {heroTemplates.length > 0 && (
            <div className="mt-16 pt-14" style={{ borderTop: '1px solid var(--line)' }}>
              <SectionHeader
                eyebrow="Featured"
                title="Start from a template"
                actionLabel="All templates"
                onAction={() => navigate('/templates')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                {heroTemplates.map((t) => (
                  <FeaturedTemplateCard
                    key={t.id}
                    t={t}
                    onClick={() => navigate(`/templates/${t.id}/create`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <aside
          className="hidden xl:flex flex-col col-span-1 overflow-y-auto"
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            borderLeft: '1px solid var(--line)',
            background: 'var(--paper-2)',
          }}
        >
          {/* Visual block */}
          <div
            className="flex-shrink-0 flex items-center justify-center py-10"
            style={{
              borderBottom: '1px solid var(--line)',
              background: 'radial-gradient(ellipse 90% 60% at 50% 110%, rgba(120,100,60,0.07) 0%, transparent 70%)',
            }}
          >
            <HeroVisual />
          </div>

          {/* Stats */}
          <div className="flex-shrink-0 px-7 py-6" style={{ borderBottom: '1px solid var(--line)' }}>
            <p className="eyebrow mb-4">— Overview</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                value={loading ? '—' : String(presentations.length)}
                label="Decks"
                accent="var(--ink-strong)"
              />
              <StatCard
                value={loading ? '—' : String(totalSlides)}
                label="Slides"
                accent="var(--ink-faint)"
              />
            </div>
          </div>

          <div className="px-7 py-6 flex flex-col gap-7 flex-1 overflow-y-auto">
            {/* Recent activity */}
            {!loading && presentations.length > 0 && (
              <div>
                <p className="eyebrow mb-3">— Recent</p>
                <div className="flex flex-col -mx-2">
                  {presentations.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/presentations/${p.id}`)}
                      className="group flex items-center gap-3 px-2 py-2.5 rounded-lg text-left w-full transition-all duration-150"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(10,9,7,0.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: 'var(--ink-faint)' }}
                      />
                      <span
                        className="text-[12.5px] font-medium truncate flex-1 leading-tight"
                        style={{ color: 'var(--ink)' }}
                      >
                        {p.title}
                      </span>
                      <span className="eyebrow flex-shrink-0" style={{ fontSize: 10, opacity: 0.7 }}>
                        {timeAgo(p.updated_at)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ height: 1, background: 'var(--line)', flexShrink: 0 }} />

            {/* AI prompts */}
            <div>
              <p className="eyebrow mb-3">— Try with AI</p>
              <div className="flex flex-col gap-2">
                {AI_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => navigate('/create')}
                    className="group flex items-start gap-3 text-left p-3.5 rounded-xl transition-all duration-150 w-full"
                    style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--line-strong)'
                      e.currentTarget.style.background = 'var(--paper)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(10,9,7,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--line)'
                      e.currentTarget.style.background = 'var(--surface)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <Wand2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--ink-faint)' }} />
                    <span className="text-[12px] leading-snug flex-1" style={{ color: 'var(--ink-soft)' }}>
                      {prompt}
                    </span>
                    <ArrowUpRight
                      size={12}
                      className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--ink-muted)' }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppLayout>
  )
}

// ── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderTop: `2px solid ${accent}`,
      }}
    >
      <p
        className="font-sans font-bold text-[30px] leading-none tracking-tight mb-2"
        style={{ color: 'var(--ink-strong)' }}
      >
        {value}
      </p>
      <p className="eyebrow">{label}</p>
    </div>
  )
}

// ── Section header ──────────────────────────────────────────────────────────
function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  onAction,
}: {
  eyebrow: string
  title: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex items-end justify-between mb-7 flex-wrap gap-4">
      <div>
        <p className="eyebrow mb-3">— {eyebrow}</p>
        <h2
          className="font-sans font-semibold leading-[1.1] tracking-tight"
          style={{ fontSize: 'clamp(20px, 1.8vw, 28px)', color: 'var(--ink-strong)' }}
        >
          {title}
        </h2>
      </div>
      <button
        onClick={onAction}
        className="group text-[13px] font-semibold flex items-center gap-1.5 pb-0.5 transition-all"
        style={{ color: 'var(--ink-muted)', borderBottom: '1px solid transparent' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--ink-strong)'
          e.currentTarget.style.borderBottomColor = 'var(--ink-strong)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--ink-muted)'
          e.currentTarget.style.borderBottomColor = 'transparent'
        }}
      >
        {actionLabel}
        <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  )
}

// ── Start card ──────────────────────────────────────────────────────────────
function StartCard({
  icon,
  title,
  description,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  primary?: boolean
}) {
  const fg = primary ? '#fff' : 'var(--ink-strong)'
  const fgSoft = primary ? 'rgba(255,255,255,0.55)' : 'var(--ink-soft)'
  const restShadow = primary
    ? '0 2px 8px rgba(10,9,7,0.20), 0 8px 28px -4px rgba(10,9,7,0.26)'
    : '0 1px 3px rgba(10,9,7,0.04), 0 4px 16px -2px rgba(10,9,7,0.08)'
  const hoverShadow = primary
    ? '0 4px 16px rgba(10,9,7,0.26), 0 20px 52px -8px rgba(10,9,7,0.34)'
    : '0 2px 8px rgba(10,9,7,0.07), 0 16px 40px -6px rgba(10,9,7,0.12)'

  return (
    <button
      onClick={onClick}
      className="group relative text-left p-5 rounded-2xl w-full transition-all duration-[240ms] ease-out"
      style={{
        background: primary
          ? 'linear-gradient(148deg, #161310 0%, #2b2319 100%)'
          : 'var(--surface)',
        border: primary ? '1px solid rgba(255,255,255,0.07)' : '1px solid var(--line)',
        color: fg,
        boxShadow: restShadow,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = hoverShadow
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = restShadow
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-7"
        style={{
          background: primary ? 'rgba(255,255,255,0.10)' : 'rgba(10,9,7,0.05)',
          border: primary ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(10,9,7,0.07)',
          color: fg,
        }}
      >
        {icon}
      </div>
      <p className="font-sans font-semibold text-[15px] leading-tight tracking-tight mb-1.5" style={{ color: fg }}>
        {title}
      </p>
      <p className="text-[12.5px] leading-relaxed" style={{ color: fgSoft }}>
        {description}
      </p>
      <ArrowUpRight
        size={13}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
        style={{ color: fg }}
      />
    </button>
  )
}

// ── Deck card ───────────────────────────────────────────────────────────────
function DeckCard({
  p,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpen,
  onDelete,
}: {
  p: PresentationListItem
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onOpen: () => void
  onDelete: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.21)
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
    <div className="group">
      <div
        ref={ref}
        onClick={onOpen}
        className="relative aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ease-out"
        style={{
          background: '#0A0907',
          boxShadow: '0 1px 2px rgba(15,14,12,0.08), 0 4px 16px -4px rgba(15,14,12,0.12)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(15,14,12,0.10), 0 20px 44px -8px rgba(15,14,12,0.22)'
          e.currentTarget.style.transform = 'translateY(-3px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,14,12,0.08), 0 4px 16px -4px rgba(15,14,12,0.12)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {p.preview_slide ? (
          <div className="absolute inset-0">
            <div
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: SLIDE_W, height: SLIDE_H,
                transform: `translate(-50%, -50%) scale(${scale})`,
                transformOrigin: 'center',
              }}
            >
              <SlidePreview slide={p.preview_slide} scale={1} />
            </div>
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'var(--paper)', color: 'var(--ink-faint)' }}
          >
            <span className="font-sans text-xs tracking-wide">No preview</span>
          </div>
        )}
      </div>

      <div className="pt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="font-sans font-medium text-[14.5px] leading-tight tracking-tight truncate"
            style={{ color: 'var(--ink-strong)' }}
          >
            {p.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="eyebrow">{timeAgo(p.updated_at)}</span>
            {p.total_slides > 0 && (
              <>
                <span className="w-0.5 h-0.5 rounded-full" style={{ background: 'var(--ink-faint)' }} />
                <span className="eyebrow">{p.total_slides} slides</span>
              </>
            )}
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMenu() }}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{ color: 'var(--ink-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(10,9,7,0.07)'
              e.currentTarget.style.color = 'var(--ink-strong)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--ink-muted)'
            }}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-10 rounded-xl py-1.5 w-36"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                boxShadow: '0 4px 16px rgba(10,9,7,0.10), 0 1px 4px rgba(10,9,7,0.06)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { onOpen(); onCloseMenu() }}
                className="w-full text-left px-3.5 py-2 text-[13px] transition-colors"
                style={{ color: 'var(--ink)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Open
              </button>
              <button
                onClick={onDelete}
                className="w-full text-left px-3.5 py-2 text-[13px] transition-colors"
                style={{ color: 'var(--accent)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Featured template card ──────────────────────────────────────────────────
function FeaturedTemplateCard({ t, onClick }: { t: TemplateListItem; onClick: () => void }) {
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

  return (
    <button onClick={onClick} className="group text-left w-full block">
      <div
        ref={ref}
        className="aspect-[16/9] relative overflow-hidden rounded-2xl transition-all duration-300 ease-out"
        style={{
          background: '#0A0907',
          boxShadow: '0 1px 2px rgba(15,14,12,0.08), 0 4px 16px -4px rgba(15,14,12,0.12)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(15,14,12,0.10), 0 20px 44px -8px rgba(15,14,12,0.22)'
          e.currentTarget.style.transform = 'translateY(-3px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,14,12,0.08), 0 4px 16px -4px rgba(15,14,12,0.12)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {t.preview_slide ? (
          <div className="absolute inset-0">
            <div
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: SLIDE_W, height: SLIDE_H,
                transform: `translate(-50%, -50%) scale(${scale})`,
                transformOrigin: 'center',
              }}
            >
              <SlidePreview slide={t.preview_slide} theme={t.theme ?? undefined} scale={1} />
            </div>
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'var(--paper)', color: 'var(--ink-faint)' }}
          >
            <span className="font-sans text-xs tracking-wide opacity-40">{t.name}</span>
          </div>
        )}
      </div>
      <div className="pt-4">
        <p
          className="font-sans font-medium text-[14.5px] leading-tight tracking-tight mb-1 truncate"
          style={{ color: 'var(--ink-strong)' }}
        >
          {t.name}
        </p>
        <p className="eyebrow">{t.category}</p>
      </div>
    </button>
  )
}

// ── Hero visual ─────────────────────────────────────────────────────────────
function HeroVisual() {
  return (
    <div
      aria-hidden
      className="pointer-events-none select-none relative"
      style={{ width: 310, height: 270 }}
    >
      {/* Back slide */}
      <div
        style={{
          position: 'absolute',
          width: 258, height: 145,
          top: 66, left: 2,
          borderRadius: 12,
          background: 'linear-gradient(140deg, #f5f1ea 0%, #ece7de 100%)',
          border: '1px solid rgba(0,0,0,0.07)',
          transform: 'rotate(-5.5deg)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ position: 'absolute', top: 22, left: 20, width: '44%', height: 7, borderRadius: 4, background: 'rgba(0,0,0,0.10)' }} />
        <div style={{ position: 'absolute', top: 34, left: 20, width: '30%', height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }} />
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, display: 'flex', gap: 5 }}>
          {[0.07, 0.055, 0.065].map((o, i) => (
            <div key={i} style={{ flex: 1, height: 32, borderRadius: 5, background: `rgba(0,0,0,${o})` }} />
          ))}
        </div>
      </div>

      {/* Middle slide */}
      <div
        style={{
          position: 'absolute',
          width: 258, height: 145,
          top: 38, left: 16,
          borderRadius: 12,
          background: 'linear-gradient(140deg, #f9f8f5 0%, #f1ede7 100%)',
          border: '1px solid rgba(0,0,0,0.09)',
          transform: 'rotate(-2deg)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.09)',
        }}
      >
        <div style={{ position: 'absolute', top: 20, left: 20, width: '57%', height: 8, borderRadius: 5, background: 'rgba(0,0,0,0.13)' }} />
        <div style={{ position: 'absolute', top: 34, left: 20, width: '40%', height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.07)' }} />
        <div style={{ position: 'absolute', right: 20, top: 20, width: 48, height: 48, borderRadius: 9, background: 'rgba(0,0,0,0.05)' }} />
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, height: 1, background: 'rgba(0,0,0,0.06)' }} />
      </div>

      {/* Front slide — dark */}
      <div
        style={{
          position: 'absolute',
          width: 258, height: 145,
          top: 10, left: 34,
          borderRadius: 12,
          background: 'linear-gradient(148deg, #131110 0%, #231d14 55%, #1b1711 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          transform: 'rotate(1.5deg)',
          boxShadow: '0 16px 56px rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ position: 'absolute', top: 22, left: 20, width: '52%', height: 9, borderRadius: 5, background: 'rgba(255,255,255,0.85)' }} />
        <div style={{ position: 'absolute', top: 37, left: 20, width: '35%', height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.28)' }} />
        <div style={{ position: 'absolute', bottom: 20, left: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, width: '52%' }}>
          {[0.11, 0.07, 0.09, 0.06].map((o, i) => (
            <div key={i} style={{ height: 22, borderRadius: 4, background: `rgba(255,255,255,${o})` }} />
          ))}
        </div>
        <div
          style={{
            position: 'absolute', right: 20, bottom: 20,
            width: 60, height: 60,
            borderRadius: 9,
            background: 'linear-gradient(135deg, rgba(200,168,108,0.44) 0%, rgba(168,132,68,0.26) 100%)',
            border: '1px solid rgba(200,168,108,0.18)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5,
            borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
            background: 'linear-gradient(90deg, transparent 0%, rgba(200,168,108,0.45) 25%, rgba(220,185,115,0.9) 50%, rgba(200,168,108,0.45) 75%, transparent 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 100,
            padding: '3px 8px',
            fontSize: 8,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase',
          }}
        >
          AI
        </div>
      </div>
    </div>
  )
}
