import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { presentationsApi, templatesApi } from '../api/client'
import { AppLayout } from '../components/Layout/AppLayout'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import { Button } from '../components/ui/Button'
import type { PresentationListItem, TemplateListItem } from '../types'
import { Upload, MoreHorizontal, Sparkles, ArrowUpRight, FileUp, FilePlus, Wand2 } from 'lucide-react'
import { ImportModal } from '../components/Dashboard/ImportModal'

const SLIDE_W = 1280
const SLIDE_H = 720

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`
  if (hours < 24) return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
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

  return (
    <AppLayout>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}

      {/* Subtle warm radial glow from top */}
      <div
        style={{
          background:
            'radial-gradient(ellipse 90% 40% at 55% 0%, rgba(130,108,72,0.07) 0%, transparent 58%)',
        }}
      >
        <div className="w-full px-6 md:px-10 lg:px-12 pt-12 pb-28 max-w-[1200px]">

          {/* ── Hero ── */}
          <div>
            <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
              <p className="eyebrow">— Workspace</p>
              <div className="flex items-center gap-2.5">
                <Button
                  variant="secondary"
                  onClick={() => setShowImport(true)}
                  leadingIcon={<Upload size={13} />}
                >
                  Import
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate('/create')}
                  leadingIcon={<Sparkles size={13} />}
                >
                  Generate
                </Button>
              </div>
            </div>

            <h1
              className="font-serif leading-[1.0] tracking-tightest text-[40px] md:text-[56px] max-w-4xl"
              style={{ color: 'var(--ink-strong)' }}
            >
              {greeting}.
              <br />
              <span className="font-serif-italic" style={{ color: 'var(--accent)' }}>
                Create something great.
              </span>
            </h1>
            <p
              className="text-[15.5px] mt-7 max-w-md leading-[1.7]"
              style={{ color: 'var(--ink-soft)' }}
            >
              Decks, templates, and AI — powered by WAC, all in one workspace.
            </p>
          </div>

          {/* ── Quick actions ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
            <QuickAction
              icon={<Wand2 size={16} />}
              label="01"
              title="Create PPTX Using AI/Documents"
              description="Describe your topic. AI assembles the deck."
              onClick={() => navigate('/create')}
              primary
            />
            <QuickAction
              icon={<FilePlus size={16} />}
              label="02"
              title="Pick a template"
              description="Start from a hand-designed layout."
              onClick={() => navigate('/templates')}
            />
            <QuickAction
              icon={<FileUp size={16} />}
              label="03"
              title="Import a PPTX"
              description="Bring an existing PowerPoint in."
              onClick={() => setShowImport(true)}
            />
          </div>

          {/* ── Recent decks ── */}
          <div className="mt-16">
            <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
              <div>
                <p className="eyebrow mb-3">— Your work</p>
                <h2
                  className="font-sans font-semibold leading-[1.1] tracking-tight text-[26px] md:text-[34px]"
                  style={{ color: 'var(--ink-strong)' }}
                >
                  Recent decks
                </h2>
              </div>
              <button
                onClick={() => navigate('/decks')}
                className="text-[13px] font-semibold flex items-center gap-1.5 transition-colors group pb-0.5"
                style={{ color: 'var(--ink-strong)', borderBottom: '1px solid transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderBottomColor = 'var(--ink-strong)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderBottomColor = 'transparent'
                }}
              >
                All decks
                <ArrowUpRight
                  size={13}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </button>
            </div>

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className="rounded-3xl px-12 py-16 text-center"
                style={{
                  background: 'linear-gradient(160deg, var(--surface) 0%, var(--paper) 100%)',
                  border: '1px dashed var(--line-strong)',
                  boxShadow: '0 2px 12px rgba(10,9,7,0.04) inset',
                }}
              >
                <p
                  className="font-sans font-semibold text-[28px] md:text-[32px] leading-tight tracking-tight mb-3"
                  style={{ color: 'var(--ink-strong)' }}
                >
                  Start your first presentation,
                  <br />
                  <span className="italic font-medium" style={{ color: 'var(--accent)' }}>
                    ready for you.
                  </span>
                </p>
                <p
                  className="text-[14px] mb-8 max-w-sm mx-auto leading-relaxed"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  Create your first deck — generate from a prompt, or start from a template.
                </p>
                <div className="flex items-center justify-center gap-2.5">
                  <Button variant="secondary" onClick={() => navigate('/templates')}>
                    Browse templates
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/create')}
                    leadingIcon={<Sparkles size={13} />}
                  >
                    Generate with AI
                  </Button>
                </div>
              </div>
            )}

            {!loading && presentations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {presentations.slice(0, 3).map((p) => (
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

          {/* ── Featured templates ── */}
          {heroTemplates.length > 0 && (
            <div
              className="mt-16"
              style={{
                borderTop: '1px solid rgba(0,0,0,0.06)',
                paddingTop: '48px',
              }}
            >
              <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
                <div>
                  <p className="eyebrow mb-3">— Featured</p>
                  <h2
                    className="font-sans font-semibold leading-[1.1] tracking-tight text-[26px] md:text-[34px]"
                    style={{ color: 'var(--ink-strong)' }}
                  >
                    A starting point
                  </h2>
                </div>
                <button
                  onClick={() => navigate('/templates')}
                  className="text-[13px] font-semibold flex items-center gap-1.5 transition-colors group pb-0.5"
                  style={{ color: 'var(--ink-strong)', borderBottom: '1px solid transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderBottomColor = 'var(--ink-strong)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderBottomColor = 'transparent'
                  }}
                >
                  All templates
                  <ArrowUpRight
                    size={13}
                    className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                  />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>
    </AppLayout>
  )
}

// ── Quick action card ───────────────────────────────────────────────────────
function QuickAction({
  icon,
  label,
  title,
  description,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode
  label: string
  title: string
  description: string
  onClick: () => void
  primary?: boolean
}) {
  const fg = primary ? '#fff' : 'var(--ink-strong)'
  const fgSoft = primary ? 'rgba(255,255,255,0.65)' : 'var(--ink-soft)'
  const fgFaint = primary ? 'rgba(255,255,255,0.38)' : 'var(--ink-muted)'

  const restShadow = primary
    ? '0 2px 8px rgba(10,9,7,0.22), 0 8px 28px -4px rgba(10,9,7,0.28)'
    : '0 1px 2px rgba(10,9,7,0.04), 0 4px 14px -2px rgba(10,9,7,0.07)'
  const hoverShadow = primary
    ? '0 4px 16px rgba(10,9,7,0.28), 0 24px 52px -8px rgba(10,9,7,0.38)'
    : '0 2px 8px rgba(10,9,7,0.07), 0 18px 40px -6px rgba(10,9,7,0.14)'

  return (
    <button
      onClick={onClick}
      className="group relative text-left p-7 rounded-2xl transition-all duration-300 ease-out"
      style={{
        background: primary
          ? 'linear-gradient(148deg, #1c1914 0%, #2e2820 100%)'
          : 'var(--surface)',
        border: primary
          ? '1px solid rgba(255,255,255,0.07)'
          : '1px solid var(--line)',
        color: fg,
        boxShadow: restShadow,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = hoverShadow
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = restShadow
      }}
    >
      <div className="flex items-center justify-between mb-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: primary ? 'rgba(255,255,255,0.10)' : 'rgba(10,9,7,0.05)',
            border: primary ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(10,9,7,0.06)',
            color: fg,
          }}
        >
          {icon}
        </div>
        <p className="eyebrow" style={{ color: fgFaint }}>{label}</p>
      </div>
      <p
        className="font-sans font-semibold text-[18px] leading-tight tracking-tight mb-2.5"
        style={{ color: fg }}
      >
        {title}
      </p>
      <p className="text-[13px] leading-relaxed" style={{ color: fgSoft }}>
        {description}
      </p>
      <ArrowUpRight
        size={15}
        className="absolute top-7 right-7 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
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
        onClick={onOpen}
        className="relative aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ease-out"
        style={{
          background: '#0A0907',
          boxShadow:
            '0 1px 2px rgba(15,14,12,0.08), 0 4px 16px -4px rgba(15,14,12,0.13)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            '0 2px 4px rgba(15,14,12,0.10), 0 20px 44px -8px rgba(15,14,12,0.22)'
          e.currentTarget.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            '0 1px 2px rgba(15,14,12,0.08), 0 4px 16px -4px rgba(15,14,12,0.13)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {p.preview_slide ? (
          <div ref={ref} className="absolute inset-0">
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

      <div className="pt-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="font-sans font-medium text-[15px] leading-tight tracking-tight truncate"
            style={{ color: 'var(--ink-strong)' }}
          >
            {p.title}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="eyebrow">{timeAgo(p.updated_at)}</span>
            {p.total_slides > 0 && (
              <>
                <span className="w-0.5 h-0.5 rounded-full" style={{ background: 'var(--ink-faint)' }} />
                <span className="eyebrow">{p.total_slides}p</span>
              </>
            )}
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMenu() }}
            className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
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
              className="absolute right-0 top-9 z-10 rounded-xl py-1.5 w-40"
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
          boxShadow:
            '0 1px 2px rgba(15,14,12,0.08), 0 4px 16px -4px rgba(15,14,12,0.13)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            '0 2px 4px rgba(15,14,12,0.10), 0 20px 44px -8px rgba(15,14,12,0.22)'
          e.currentTarget.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            '0 1px 2px rgba(15,14,12,0.08), 0 4px 16px -4px rgba(15,14,12,0.13)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {t.preview_slide ? (
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
            <SlidePreview slide={t.preview_slide} theme={t.theme ?? undefined} scale={1} />
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
      <div className="pt-5">
        <p
          className="font-sans font-semibold text-[15px] leading-tight tracking-tight mb-1.5 truncate"
          style={{ color: 'var(--ink-strong)' }}
        >
          {t.name}
        </p>
        <p className="eyebrow">{t.category}</p>
      </div>
    </button>
  )
}
