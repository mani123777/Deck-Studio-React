import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  LayoutTemplate,
  Library,
  Settings,
  MoreHorizontal,
  UserPlus,
  MessageSquare,
  Trash2,
  Search,
  Star,
  Clock,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

function IconStrip() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const navIcons = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: LayoutTemplate, label: 'Templates', path: '/templates' },
    { icon: Library, label: 'Library', path: '/dashboard' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]

  return (
    <div className="w-14 flex-shrink-0 flex flex-col items-center py-3 gap-1" style={{ background: '#0f172a' }}>
      {/* Logo */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2 flex-shrink-0" style={{ background: '#6366f1' }}>
        <span className="text-white font-bold text-[10px] tracking-tight">WAC</span>
      </div>

      {/* Nav icons */}
      <div className="flex flex-col items-center gap-0.5 flex-1">
        {navIcons.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path
          return (
            <button
              key={label}
              title={label}
              onClick={() => navigate(path)}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
              style={{
                color: active ? '#fff' : 'rgba(148,163,184,0.8)',
                background: active ? 'rgba(99,102,241,0.25)' : 'transparent',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(148,163,184,0.8)' } }}
            >
              <Icon size={17} />
            </button>
          )
        })}
        <button
          title="More"
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
          style={{ color: 'rgba(148,163,184,0.8)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(148,163,184,0.8)' }}
        >
          <MoreHorizontal size={17} />
        </button>
      </div>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-1">
        {[UserPlus, MessageSquare].map((Icon, i) => (
          <button
            key={i}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
            style={{ color: 'rgba(148,163,184,0.6)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(148,163,184,0.6)' }}
          >
            <Icon size={16} />
          </button>
        ))}
        <button
          title={user?.full_name ?? 'Account'}
          onClick={() => { logout(); navigate('/login') }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold mt-1 transition-opacity hover:opacity-80"
          style={{ background: '#6366f1', fontSize: '11px' }}
        >
          {initials}
        </button>
      </div>
    </div>
  )
}

function NavPanel() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const navItems = [
    { icon: LayoutTemplate, label: 'All Decks', path: '/dashboard', match: '/dashboard' },
    { icon: Search, label: 'Search', path: '/dashboard', shortcut: 'Ctrl+K' },
    { icon: Clock, label: 'Recently viewed', path: '/dashboard' },
    { icon: Star, label: 'Favorites', path: '/dashboard' },
  ]

  return (
    <div className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col py-3 overflow-y-hidden shadow-sm">
      {/* Workspace */}
      <div className="px-3 mb-2">
        <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">WAC Deck Studio</p>
            <p className="text-[11px] text-gray-400 leading-tight truncate mt-0.5">{user?.email}</p>
          </div>
          <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
        </button>
      </div>

      {/* Upgrade */}
      <div className="px-3 mb-3">
        <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors border"
          style={{ borderColor: '#e0e7ff', color: '#6366f1', background: '#f5f3ff' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#ede9fe'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#f5f3ff'}
        >
          <span>✦</span>
          <span>Upgrade for more AI</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2">
        {navItems.map(({ icon: Icon, label, path, shortcut, match }) => {
          const active = location.pathname === (match ?? path) && label === 'All Decks'
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors mb-0.5 ${
                active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={14} className="flex-shrink-0" style={{ color: active ? '#6366f1' : undefined }} />
              <span className="flex-1 text-left">{label}</span>
              {shortcut && <span className="text-[10px] text-gray-300 font-medium">{shortcut}</span>}
            </button>
          )
        })}

        <div className="mt-5 mb-1.5 px-2.5">
          <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest">Folders</p>
        </div>
      </nav>

      {/* Trash */}
      <div className="px-2 mt-1">
        <button className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
          <Trash2 size={14} />
          <span>Trash</span>
        </button>
      </div>
    </div>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <NavPanel />
      <main className="flex-1 overflow-y-auto bg-white">{children}</main>
    </div>
  )
}
