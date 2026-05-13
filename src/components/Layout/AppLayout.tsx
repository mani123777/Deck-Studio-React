import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutTemplate,
  Library,
  Search,
  Home,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  FolderKanban,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../ui/Toast'

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const toast = useToast()

  const handleLogout = async () => {
    const firstName = user?.full_name?.split(' ')[0]
    const toastId = toast.loading('Signing you out…', 'Clearing your session.')
    await new Promise((r) => setTimeout(r, 700))
    logout()
    toast.update(toastId, {
      variant: 'success',
      title: firstName ? `Signed out. See you, ${firstName}.` : 'Signed out.',
      description: 'You can sign back in anytime.',
    })
    await new Promise((r) => setTimeout(r, 900))
    navigate('/login')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const primary = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: LayoutTemplate, label: 'Decks', path: '/decks' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: Library, label: 'Templates', path: '/templates' },
  ]

  const isActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path)

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <aside
        className="w-[60px] flex-shrink-0 flex flex-col items-center py-4 gap-0.5"
        style={{ background: '#F7F7F6', borderRight: '1px solid var(--line)' }}
      >
        {/* Logo mark */}
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-opacity hover:opacity-80"
          style={{ background: 'var(--ink-strong)', color: '#fff' }}
        >
          <span className="text-[8px] font-bold tracking-tight">WAC</span>
        </button>

        {/* New deck */}
        <button
          onClick={() => navigate('/create')}
          title="New deck"
          className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors"
          style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink-strong)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.10)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
        >
          <Plus size={14} />
        </button>

        {/* Nav icons */}
        {primary.map(({ icon: Icon, label, path }) => {
          const active = isActive(path)
          return (
            <button
              key={label}
              title={label}
              onClick={() => navigate(path)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: active ? 'var(--ink-strong)' : 'transparent',
                color: active ? '#fff' : 'var(--ink-muted)',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
                  e.currentTarget.style.color = 'var(--ink-strong)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--ink-muted)'
                }
              }}
            >
              <Icon size={15} />
            </button>
          )
        })}

        <div className="flex-1" />

        {/* Expand + avatar */}
        <button
          onClick={onToggle}
          title="Expand"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: 'var(--ink-faint)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-faint)')}
        >
          <ChevronsRight size={14} />
        </button>
        <button
          onClick={handleLogout}
          title={user?.full_name ?? 'Account'}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold mt-1 transition-opacity hover:opacity-80"
          style={{ background: 'var(--ink-strong)', color: '#fff' }}
        >
          {initials}
        </button>
      </aside>
    )
  }

  // ── Expanded ───────────────────────────────────────────────────────────────
  return (
    <aside
      className="w-[248px] flex-shrink-0 flex flex-col"
      style={{ background: '#F7F7F6', borderRight: '1px solid var(--line)' }}
    >
      {/* Workspace header */}
      <div
        className="h-[54px] flex items-center px-4 gap-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--ink-strong)', color: '#fff' }}
        >
          <span className="text-[8px] font-bold tracking-tight">WAC</span>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[13.5px] font-semibold truncate leading-none"
            style={{ color: 'var(--ink-strong)', letterSpacing: '-0.02em' }}
          >
            Deck Studio
          </p>
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--ink-faint)' }}>
            {user?.email ?? 'workspace'}
          </p>
        </div>
        <button
          onClick={onToggle}
          title="Collapse"
          className="w-6 h-6 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
          style={{ color: 'var(--ink-faint)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-faint)')}
        >
          <ChevronsLeft size={13} />
        </button>
      </div>

      {/* Actions */}
      <div className="px-3 pt-3 pb-2 space-y-1.5">
        <button
          onClick={() => navigate('/create')}
          className="w-full h-9 px-3 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all"
          style={{ background: 'var(--ink-strong)', color: '#fff' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1C1A17')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ink-strong)')}
        >
          <Plus size={13} strokeWidth={2.5} />
          <span className="flex-1 text-left">New deck</span>
        </button>

        <button
          className="w-full flex items-center gap-2 px-3 h-8 rounded-lg text-[12.5px] transition-colors"
          style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--ink-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.07)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
        >
          <Search size={12} />
          <span className="flex-1 text-left">Search</span>
          <span
            className="font-mono text-[10.5px]"
            style={{ color: 'var(--ink-faint)' }}
          >
            ⌘K
          </span>
        </button>
      </div>

      {/* Section label */}
      <p
        className="px-4 pt-4 pb-1.5 font-mono text-[10px] uppercase tracking-[0.14em]"
        style={{ color: 'var(--ink-faint)' }}
      >
        Workspace
      </p>

      {/* Nav */}
      <nav className="px-2 flex flex-col gap-px">
        {primary.map(({ icon: Icon, label, path }) => {
          const active = isActive(path)
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="relative w-full flex items-center gap-2.5 px-3 h-[33px] rounded-lg text-[13px] transition-all"
              style={{
                background: active ? 'rgba(0,0,0,0.06)' : 'transparent',
                color: active ? 'var(--ink-strong)' : 'var(--ink-soft)',
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
                  e.currentTarget.style.color = 'var(--ink-strong)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--ink-soft)'
                }
              }}
            >
              {/* Active indicator */}
              {active && (
                <span
                  className="absolute left-0 top-[5px] bottom-[5px] w-[2.5px] rounded-full"
                  style={{ background: 'var(--ink-strong)' }}
                />
              )}
              <Icon size={14} />
              <span className="flex-1 text-left">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* Bottom — user + settings */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 flex-1 px-2 py-1.5 rounded-lg transition-colors text-left min-w-0"
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ background: 'var(--ink-strong)', color: '#fff' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[12.5px] font-semibold truncate leading-tight"
                style={{ color: 'var(--ink-strong)' }}
              >
                {user?.full_name ?? 'Account'}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'var(--ink-muted)' }}>
                Sign out
              </p>
            </div>
          </button>

          <button
            title="Settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: 'var(--ink-faint)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.05)'
              e.currentTarget.style.color = 'var(--ink-strong)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--ink-faint)'
            }}
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

// ── AppLayout ────────────────────────────────────────────────────────────────
export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--paper)' }}>
        {children}
      </main>
    </div>
  )
}
