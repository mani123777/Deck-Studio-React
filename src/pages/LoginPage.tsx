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
        className="flex-1 flex flex-col p-8 lg:p-14"
        style={{ background: 'var(--paper)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
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

        {/* Form */}
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[420px]">
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
          </div>
        </div>

        <p className="text-[11.5px]" style={{ color: 'var(--ink-faint)' }}>
          © 2026 WAC Deck Studio
        </p>
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

        {/* Middle — quote */}
        <div className="relative z-10 max-w-xl">
          <p
            className="font-serif leading-[1.1] tracking-tightest text-[30px] md:text-[40px]"
            style={{ color: '#fff' }}
          >
            “Designed for the
            <br />
            <span
              className="font-serif-italic"
              style={{ color: 'rgba(255,255,255,0.72)' }}
            >
              quiet professional.”
            </span>
          </p>

          {/* hairline divider so attribution feels anchored, not floating */}
          <div
            className="mt-10 mb-6"
            style={{ height: 1, background: 'rgba(255,255,255,0.08)' }}
          />

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <Sparkles size={14} style={{ color: '#fff' }} />
            </div>
            <div>
              <p
                className="font-serif text-[14px] leading-tight"
                style={{ color: '#fff' }}
              >
                Studio Workspace
              </p>
              <p
                className="text-[11.5px] mt-0.5"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Built for teams who present often.
              </p>
            </div>
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
