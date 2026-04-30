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
    { icon: Library, label: 'Templates', path: '/templates' },
  ]

  const isActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path)

  if (collapsed) {
    return (
      <aside
        className="w-[60px] flex-shrink-0 flex flex-col items-center py-5 gap-1"
        style={{ background: 'var(--paper-2)', borderRight: '1px solid var(--line)' }}
      >
        <button
          onClick={onToggle}
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ background: 'var(--ink-strong)', color: '#fff' }}
        >
          <span className="text-[10px] font-bold tracking-tight">WAC</span>
        </button>
        {primary.map(({ icon: Icon, label, path }) => {
          const active = isActive(path)
          return (
            <button
              key={label}
              title={label}
              onClick={() => navigate(path)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: active ? 'var(--ink-strong)' : 'transparent',
                color: active ? '#fff' : 'var(--ink-soft)',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
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
              <Icon size={16} />
            </button>
          )
        })}
        <div className="flex-1" />
        <button
          onClick={onToggle}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: 'var(--ink-muted)' }}
          title="Expand"
        >
          <ChevronsRight size={16} />
        </button>
        <button
          onClick={handleLogout}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold mt-2"
          style={{ background: 'var(--ink-strong)', color: '#fff' }}
          title={user?.full_name ?? 'Account'}
        >
          {initials}
        </button>
      </aside>
    )
  }

  return (
    <aside
      className="w-[268px] flex-shrink-0 flex flex-col"
      style={{ background: 'var(--paper-2)', borderRight: '1px solid var(--line)' }}
    >
      {/* Workspace header */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--ink-strong)', color: '#fff' }}
        >
          <span className="text-[10px] font-bold tracking-tight">WAC</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-[17px] leading-tight tracking-tighter" style={{ color: 'var(--ink-strong)' }}>
            Deck Studio
          </p>
          <p className="text-[11.5px] truncate mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            {user?.email ?? 'demo'}
          </p>
        </div>
        <button
          onClick={onToggle}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: 'var(--ink-muted)' }}
          title="Collapse"
        >
          <ChevronsLeft size={14} />
        </button>
      </div>

      {/* Primary CTA */}
      <div className="px-3 pb-3">
        <button
          onClick={() => navigate('/create')}
          className="w-full h-11 px-4 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
          style={{ background: 'var(--ink-strong)', color: '#fff' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#2A2620')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ink-strong)')}
        >
          <Plus size={14} />
          New deck
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <button
          className="w-full flex items-center gap-2 px-3 h-9 rounded-xl text-[13px] transition-colors"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-muted)' }}
        >
          <Search size={13} />
          <span className="flex-1 text-left">Search</span>
        </button>
      </div>

      {/* Primary nav */}
      <nav className="px-2 flex flex-col gap-0.5">
        {primary.map(({ icon: Icon, label, path }) => {
          const active = isActive(path)
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="flex items-center gap-3 px-3 h-9 rounded-xl text-[13px] transition-all"
              style={{
                background: active ? 'var(--surface)' : 'transparent',
                color: active ? 'var(--ink-strong)' : 'var(--ink-soft)',
                fontWeight: active ? 600 : 500,
                boxShadow: active ? '0 1px 2px rgba(10,9,7,0.06)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(10,9,7,0.05)'
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
              <Icon size={15} />
              <span className="flex-1 text-left">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* Bottom row */}
      <div
        className="px-3 pb-4 pt-3 flex items-center gap-2"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 flex-1 px-2 h-10 rounded-xl transition-colors text-left min-w-0"
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(10,9,7,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: 'var(--ink-strong)', color: '#fff' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold truncate leading-tight" style={{ color: 'var(--ink-strong)' }}>
              {user?.full_name ?? 'Account'}
            </p>
            <p className="text-[11px] truncate" style={{ color: 'var(--ink-muted)' }}>Sign out</p>
          </div>
        </button>
        <button
          title="Settings"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          style={{ color: 'var(--ink-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(10,9,7,0.05)'
            e.currentTarget.style.color = 'var(--ink-strong)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--ink-muted)'
          }}
        >
          <Settings size={15} />
        </button>
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
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--paper)' }}>{children}</main>
    </div>
  )
}
