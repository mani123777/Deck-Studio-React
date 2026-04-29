import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { presentationsApi } from '../api/client'
import { AppLayout } from '../components/Layout/AppLayout'
import { getThemeById } from '../data/themes'
import type { PresentationListItem } from '../types'
import { Plus, Upload, ArrowUpDown, LayoutGrid, List, MoreHorizontal, Sparkles } from 'lucide-react'

type FilterTab = 'all' | 'recent' | 'mine' | 'favorites'
type ViewMode = 'grid' | 'list'

function ThumbPreview({ p }: { p: PresentationListItem }) {
  const theme = getThemeById(p.theme_id ?? 'vortex')
  const isDark = (() => {
    const hex = theme.colors.background.replace('#', '')
    if (hex.length < 6) return true
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5
  })()

  return (
    <div style={{
      background: theme.colors.background,
      width: '100%',
      aspectRatio: '16/9',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: '14px 16px 12px',
      boxSizing: 'border-box',
    }}>
      {/* Decorative accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: theme.colors.accent }} />

      {/* Fake slide content lines */}
      <div style={{ position: 'absolute', top: 18, left: 16, right: 16 }}>
        <div style={{
          fontFamily: `${theme.fonts.heading}, sans-serif`,
          fontSize: 13,
          fontWeight: 700,
          color: theme.colors.heading,
          lineHeight: 1.25,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        } as React.CSSProperties}>
          {p.title}
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
          {[70, 55, 80].map((w, i) => (
            <div key={i} style={{ height: 4, width: `${w}%`, borderRadius: 2, background: theme.colors.body, opacity: 0.35 }} />
          ))}
        </div>
      </div>

      {/* Accent circle decoration */}
      <div style={{
        position: 'absolute', bottom: -18, right: -18,
        width: 64, height: 64, borderRadius: '50%',
        background: `${theme.colors.accent}22`,
      }} />

      {/* Slide count badge */}
      <div style={{
        position: 'absolute', bottom: 8, right: 10,
        fontSize: 9, fontWeight: 700,
        color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
        letterSpacing: 0.5,
        fontFamily: 'Inter, sans-serif',
      }}>
        {p.total_slides} slides
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [presentations, setPresentations] = useState<PresentationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('recent')
  const [view, setView] = useState<ViewMode>('grid')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => {
    presentationsApi.list().then((r) => {
      setPresentations(r.data)
      setLoading(false)
    })
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this presentation?')) return
    await presentationsApi.delete(id)
    setPresentations((ps) => ps.filter((p) => p.id !== id))
    setOpenMenu(null)
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'recent', label: 'Recently viewed' },
    { key: 'mine', label: 'Created by you' },
    { key: 'favorites', label: 'Favorites' },
  ]

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-7xl">
        {/* Page heading */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">My Presentations</h1>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 mb-7">
          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all"
            style={{ background: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e293b'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0f172a'}
          >
            <Plus size={14} />
            Create new
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md ml-0.5" style={{ background: '#6366f1', color: '#fff' }}>AI</span>
          </button>
          <button
            onClick={() => navigate('/templates')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <Plus size={14} />
            New
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
            <Upload size={13} />
            Import
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        {/* Filter + view toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  filter === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              <ArrowUpDown size={13} />
            </button>
            <button
              onClick={() => setView('grid')}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${view === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${view === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <List size={13} />
            </button>
          </div>
        </div>

        {/* Skeleton loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-video" style={{ background: '#f1f5f9' }} />
                <div className="p-3.5">
                  <div className="h-3.5 rounded-lg w-3/4 mb-2" style={{ background: '#e2e8f0' }} />
                  <div className="h-2.5 rounded-lg w-1/2" style={{ background: '#e2e8f0' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && presentations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: '#f1f5f9' }}>
              <Sparkles size={26} style={{ color: '#6366f1' }} />
            </div>
            <p className="text-[17px] font-semibold text-gray-800 mb-1.5">No presentations yet</p>
            <p className="text-sm text-gray-400 mb-6 text-center max-w-xs">Create your first AI-powered presentation from a template</p>
            <button
              onClick={() => navigate('/templates')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: '#0f172a' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e293b'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0f172a'}
            >
              <Plus size={14} />
              Create new
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && presentations.length > 0 && view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {presentations.map((p) => (
              <div
                key={p.id}
                className="group rounded-2xl overflow-hidden cursor-pointer transition-all"
                style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
                onClick={() => navigate(`/presentations/${p.id}`)}
              >
                {/* Theme-colored thumbnail */}
                <div className="relative overflow-hidden">
                  <ThumbPreview p={p} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>

                <div className="px-3.5 py-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate leading-snug">{p.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(p.updated_at)}</p>
                    </div>
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === p.id ? null : p.id) }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600 transition-all"
                      >
                        <MoreHorizontal size={13} />
                      </button>
                      {openMenu === p.id && (
                        <div className="absolute right-0 top-7 z-10 bg-white rounded-xl py-1.5 w-36 border border-gray-100" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => { navigate(`/presentations/${p.id}`); setOpenMenu(null) }} className="w-full text-left px-3.5 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50">Open</button>
                          <button onClick={() => handleDelete(p.id)} className="w-full text-left px-3.5 py-1.5 text-[13px] text-red-500 hover:bg-red-50">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {!loading && presentations.length > 0 && view === 'list' && (
          <div className="rounded-2xl overflow-hidden border border-gray-100" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {presentations.map((p, i) => {
              const theme = getThemeById(p.theme_id ?? 'vortex')
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors ${i !== 0 ? 'border-t border-gray-50' : ''}`}
                  onClick={() => navigate(`/presentations/${p.id}`)}
                >
                  {/* Mini theme swatch */}
                  <div className="w-14 h-9 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: theme.colors.background, border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ height: 2, background: theme.colors.accent, width: '100%' }} />
                    <div style={{ padding: '4px 5px' }}>
                      <div style={{ height: 3, background: theme.colors.heading, opacity: 0.7, borderRadius: 1, width: '80%', marginBottom: 3 }} />
                      <div style={{ height: 2, background: theme.colors.body, opacity: 0.4, borderRadius: 1, width: '60%' }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{p.title}</p>
                    <p className="text-[11px] text-gray-400">{p.template_name} · {p.total_slides} slides</p>
                  </div>
                  <p className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(p.updated_at)}</p>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }} className="text-[12px] text-red-400 hover:text-red-600 flex-shrink-0 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
