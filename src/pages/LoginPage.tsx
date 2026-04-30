import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/ui/Toast'
import { Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const ready = email.trim().length > 0 && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setError('')
    setLoading(true)
    const toastId = toast.loading('Signing you in…', 'Verifying your credentials.')
    try {
      const { data: tokens } = await authApi.login(email, password)
      localStorage.setItem('access_token', tokens.access_token)
      const { data: user } = await authApi.me()
      storeLogin(tokens.access_token, tokens.refresh_token, user)
      const firstName = user.full_name?.split(' ')[0]
      toast.update(toastId, {
        variant: 'success',
        title: firstName ? `Welcome back, ${firstName}.` : 'Welcome back.',
        description: 'Taking you to your workspace.',
      })
      await new Promise((r) => setTimeout(r, 900))
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Login failed'
      setError(msg)
      toast.update(toastId, {
        variant: 'error',
        title: 'Could not sign in',
        description: msg,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--paper)' }}>
      {/* LEFT — form */}
      <div
        className="flex-1 flex items-center justify-center p-8 lg:p-14"
        style={{ background: 'var(--paper)' }}
      >
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--ink-strong)' }}
            >
              <span className="text-white text-[10px] font-bold tracking-tight">WAC</span>
            </div>
            <span
              className="font-serif text-[18px] tracking-tighter"
              style={{ color: 'var(--ink-strong)' }}
            >
              Deck Studio
            </span>
          </div>

            <p className="eyebrow mb-4">— Welcome back</p>
            <h1
              className="font-serif leading-[1.05] tracking-tightest text-[34px] md:text-[44px]"
              style={{ color: 'var(--ink-strong)' }}
            >
              Sign in to your
              <br />
              <span className="font-serif-italic" style={{ color: 'var(--ink-strong)' }}>workspace.</span>
            </h1>
            <p
              className="text-[14.5px] mt-5 mb-10 leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              Continue your decks where you left off.
            </p>

            {error && (
              <div
                className="mb-6 px-4 py-3 rounded-xl text-[13px]"
                style={{
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--line)',
                  color: 'var(--accent)',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  className="block eyebrow mb-2"
                  style={{ color: 'var(--ink-strong)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-12 px-4 rounded-xl text-[14px] focus:outline-none transition-colors"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink-strong)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--ink-strong)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="eyebrow" style={{ color: 'var(--ink-strong)' }}>
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-[12px] font-semibold underline-offset-4 hover:underline"
                    style={{ color: 'var(--ink-strong)' }}
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 pl-4 pr-12 rounded-xl text-[14px] focus:outline-none transition-colors"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink-strong)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--ink-strong)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!ready || loading}
                className="w-full h-12 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: 'var(--ink-strong)',
                  color: '#fff',
                  opacity: ready && !loading ? 1 : 0.45,
                  cursor: ready && !loading ? 'pointer' : 'not-allowed',
                  marginTop: 32,
                }}
                onMouseEnter={(e) => {
                  if (ready && !loading) e.currentTarget.style.background = '#2A2620'
                }}
                onMouseLeave={(e) => {
                  if (ready && !loading) e.currentTarget.style.background = 'var(--ink-strong)'
                }}
              >
                {loading ? 'Signing in…' : 'Continue'}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            <p
              className="text-center text-[13px] mt-8"
              style={{ color: 'var(--ink-soft)' }}
            >
              New here?{' '}
              <Link
                to="/register"
                className="font-semibold underline-offset-4 hover:underline"
                style={{ color: 'var(--ink-strong)' }}
              >
                Create an account
              </Link>
            </p>

          <p className="text-[11.5px] mt-10" style={{ color: 'var(--ink-faint)' }}>
            © 2026 WAC Deck Studio
          </p>
        </div>
      </div>

      {/* RIGHT — editorial showcase (dark) */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden p-14 flex-col justify-between"
        style={{ background: '#0A0907' }}
      >
        {/* subtle warm radial glow */}
        <div
          className="absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.06), transparent 65%)',
          }}
        />
        {/* faint bottom-left vignette for depth */}
        <div
          className="absolute -bottom-40 -left-32 w-[460px] h-[460px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.03), transparent 70%)',
          }}
        />

        {/* Top — eyebrow */}
        <div className="relative z-10 flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#fff' }}
          />
          <p
            className="font-mono text-[10.5px] uppercase tracking-[0.18em]"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Premium presentations · powered by AI
          </p>
        </div>

        {/* Middle — slide mockup */}
        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Ambient glow behind stack */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 420,
              height: 260,
              background: 'radial-gradient(ellipse, rgba(255,220,140,0.10) 0%, transparent 70%)',
              filter: 'blur(24px)',
            }}
          />

          {/* Slide stack */}
          <div className="relative" style={{ width: 360, height: 202 }}>
            {/* Slide 3 — far back, tilted right */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                transform: 'rotate(5deg) translate(28px, 14px)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              }}
            />

            {/* Slide 2 — middle, slight left tilt */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                transform: 'rotate(-2.5deg) translate(-16px, 10px)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              }}
            >
              {/* Ghost content lines */}
              <div className="flex flex-col gap-2 p-5 h-full" style={{ opacity: 0.35 }}>
                <div className="h-2 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.4)' }} />
                <div className="h-1.5 w-28 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
                <div className="flex-1 flex items-end gap-1.5 pt-2">
                  {[35, 55, 42, 70, 58].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{ height: `${h}%`, background: 'rgba(255,255,255,0.18)' }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Slide 1 — front, main content */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden"
              style={{
                background: '#F7F4EE',
                boxShadow: '0 32px 72px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              {/* Slide header */}
              <div className="flex items-start justify-between px-5 pt-4 pb-2.5">
                <div>
                  <p style={{ fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#AAA5A0', marginBottom: 3 }}>
                    Strategic Review · 2026
                  </p>
                  <p style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 15, fontWeight: 700, color: '#1A1814', lineHeight: 1.15 }}>
                    Growth Metrics
                  </p>
                </div>
                <div style={{
                  width: 24, height: 24, background: '#1A1814', borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 5.5, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>WAC</span>
                </div>
              </div>

              {/* Hairline divider */}
              <div style={{ height: 1, background: '#E4E0D8', marginLeft: 20, marginRight: 20 }} />

              {/* Bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 72, padding: '10px 20px 0' }}>
                {[
                  { h: 44, label: 'Q1' },
                  { h: 58, label: 'Q2' },
                  { h: 50, label: 'Q3' },
                  { h: 76, label: 'Q4' },
                  { h: 65, label: 'YTD' },
                  { h: 90, label: 'Proj' },
                ].map((bar, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{
                      width: '100%',
                      height: bar.h * 0.58,
                      background: i === 5 ? '#1A1814' : i === 3 ? '#4A4540' : '#D8D2C6',
                      borderRadius: '2px 2px 0 0',
                    }} />
                    <span style={{ fontSize: 6, color: '#B0ABA4', fontFamily: 'monospace', lineHeight: 1 }}>{bar.label}</span>
                  </div>
                ))}
              </div>

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, padding: '8px 20px 0' }}>
                {[
                  { v: '94%', l: 'Retention' },
                  { v: '2.4×', l: 'Growth' },
                  { v: '$1.2M', l: 'Revenue' },
                ].map((stat) => (
                  <div key={stat.l} style={{ background: '#EDE9E1', borderRadius: 7, padding: '6px 8px' }}>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: '#1A1814', margin: 0 }}>{stat.v}</p>
                    <p style={{ fontSize: 7, color: '#AAA5A0', marginTop: 2 }}>{stat.l}</p>
                  </div>
                ))}
              </div>

              {/* Bottom accent bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #1A1814 0%, #6B625A 50%, #1A1814 100%)',
              }} />
            </div>
          </div>

          {/* Badge below slide */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            <Sparkles size={11} style={{ color: 'rgba(255,255,255,0.6)' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
              AI-generated · PPTX ready
            </span>
          </div>
        </div>

        {/* Bottom — feature list */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { n: '01', t: 'AI generation', d: 'Decks from a prompt.' },
            { n: '02', t: 'Premium templates', d: 'Hand-tuned by designers.' },
            { n: '03', t: 'Export ready', d: 'PPTX, PDF, HTML.' },
          ].map((f) => (
            <div key={f.n}>
              <p
                className="font-mono text-[10.5px] uppercase tracking-[0.18em] mb-2"
                style={{ color: 'rgba(255,255,255,0.40)' }}
              >
                {f.n}
              </p>
              <p
                className="font-serif text-[16px] leading-tight tracking-tighter mb-1"
                style={{ color: '#fff' }}
              >
                {f.t}
              </p>
              <p
                className="text-[11.5px]"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {f.d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
