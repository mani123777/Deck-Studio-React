import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutTemplate,
  Library,
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
    { icon: Home,           label: 'Home',      path: '/dashboard' },
    { icon: LayoutTemplate, label: 'Decks',     path: '/decks' },
    { icon: FolderKanban,   label: 'Projects',  path: '/projects' },
    { icon: Library,        label: 'Templates', path: '/templates' },
  ]

  const isActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path)

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <aside
        className="w-[60px] flex-shrink-0 flex flex-col items-center py-4 gap-1"
        style={{ background: 'var(--paper-2)', borderRight: '1px solid var(--line)' }}
      >
        <button
          onClick={onToggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
          style={{
            background: 'var(--ink-strong)',
            color: '#fff',
            boxShadow: '0 1px 3px rgba(10,9,7,0.18)',
          }}
        >
          <span className="text-[9px] font-bold tracking-widest">DS</span>
        </button>

        {primary.map(({ icon: Icon, label, path }) => {
          const active = isActive(path)
          return (
            <button
              key={label}
              title={label}
              onClick={() => navigate(path)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150"
              style={{
                background: active ? 'rgba(10,9,7,0.10)' : 'transparent',
                color: active ? 'var(--ink-strong)' : 'var(--ink-faint)',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
                  e.currentTarget.style.color = 'var(--ink)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--ink-faint)'
                }
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
            </button>
          )
        })}

        <div className="flex-1" />

        <button
          onClick={onToggle}
          title="Expand"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 mb-2"
          style={{ color: 'var(--ink-faint)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
            e.currentTarget.style.color = 'var(--ink)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--ink-faint)'
          }}
        >
          <ChevronsRight size={15} />
        </button>

        <button
          onClick={handleLogout}
          title={user?.full_name ?? 'Account'}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
          style={{
            background: 'var(--ink-strong)',
            color: '#fff',
            letterSpacing: '0.04em',
          }}
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
      style={{ background: 'var(--paper-2)', borderRight: '1px solid var(--line)' }}
    >
      {/* Workspace header */}
      <div className="px-4 pt-6 pb-5 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--ink-strong)',
            color: '#fff',
            boxShadow: '0 1px 3px rgba(10,9,7,0.20)',
          }}
        >
          <span className="text-[9px] font-bold tracking-widest">DS</span>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-serif text-[15px] leading-none tracking-tight"
            style={{ color: 'var(--ink-strong)' }}
          >
            Deck Studio
          </p>
          <p
            className="text-[11px] truncate mt-1 leading-none"
            style={{ color: 'var(--ink-faint)' }}
          >
            {user?.email ?? 'demo'}
          </p>
        </div>
        <button
          onClick={onToggle}
          title="Collapse"
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150"
          style={{ color: 'var(--ink-faint)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
            e.currentTarget.style.color = 'var(--ink)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--ink-faint)'
          }}
        >
          <ChevronsLeft size={14} />
        </button>
      </div>

      {/* Primary CTA */}
      <div className="px-3 pb-4">
        <button
          onClick={() => navigate('/create')}
          className="w-full h-[38px] px-4 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: 'var(--ink-strong)',
            color: '#fff',
            letterSpacing: '-0.01em',
            boxShadow: '0 1px 3px rgba(10,9,7,0.16), 0 4px 14px -2px rgba(10,9,7,0.14)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#262018'
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(10,9,7,0.20), 0 8px 22px -4px rgba(10,9,7,0.18)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--ink-strong)'
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(10,9,7,0.16), 0 4px 14px -2px rgba(10,9,7,0.14)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Plus size={13} strokeWidth={2.5} />
          New deck
        </button>
      </div>

      {/* Section label */}
      <p className="px-5 mb-1.5 text-[10.5px] font-semibold tracking-widest uppercase" style={{ color: 'var(--ink-faint)', letterSpacing: '0.10em' }}>
        Menu
      </p>

      {/* Primary nav */}
      <nav className="px-3 flex flex-col gap-0.5">
        {primary.map(({ icon: Icon, label, path }) => {
          const active = isActive(path)
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="group flex items-center gap-3 px-3 h-9 rounded-xl text-[13px] w-full text-left transition-all duration-150"
              style={{
                background: active ? 'rgba(10,9,7,0.08)' : 'transparent',
                color: active ? 'var(--ink-strong)' : 'var(--ink-soft)',
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(10,9,7,0.05)'
                  e.currentTarget.style.color = 'var(--ink)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--ink-soft)'
                }
              }}
            >
              <Icon
                size={15}
                strokeWidth={active ? 2.2 : 1.8}
                style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}
              />
              <span className="flex-1 leading-none">{label}</span>
              {active && (
                <span
                  className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{ background: 'var(--ink-strong)' }}
                />
              )}
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* Bottom user row */}
      <div
        className="px-3 py-3"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 flex-1 px-2 py-2 rounded-xl transition-all duration-150 text-left min-w-0"
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(10,9,7,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{
                background: 'var(--ink-strong)',
                color: '#fff',
                letterSpacing: '0.04em',
              }}
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
              <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: 'var(--ink-faint)' }}>
                Sign out
              </p>
            </div>
          </button>

          <button
            title="Settings"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 flex-shrink-0"
            style={{ color: 'var(--ink-faint)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
              e.currentTarget.style.color = 'var(--ink)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--ink-faint)'
            }}
          >
            <Settings size={14} strokeWidth={1.8} />
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
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--paper)' }}>{children}</main>
    </div>
  )
}
