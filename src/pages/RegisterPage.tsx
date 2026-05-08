import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/ui/Toast'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export function RegisterPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)
  const toast = useToast()
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const ready =
    form.email.trim().length > 0 &&
    form.password.length >= 8 &&
    form.full_name.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setError('')
    setLoading(true)
    const toastId = toast.loading('Creating your account...', 'Setting up your workspace.')
    try {
      await authApi.register(form.email, form.password, form.full_name)
      const { data: tokens } = await authApi.login(form.email, form.password)
      localStorage.setItem('access_token', tokens.access_token)
      const { data: user } = await authApi.me()
      storeLogin(tokens.access_token, tokens.refresh_token, user)
      const firstName = user.full_name?.split(' ')[0]
      toast.update(toastId, {
        variant: 'success',
        title: firstName ? `Welcome, ${firstName}.` : 'Welcome.',
        description: 'Taking you to your workspace.',
      })
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Registration failed'
      setError(msg)
      toast.update(toastId, {
        variant: 'error',
        title: 'Could not create account',
        description: msg,
      })
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const barHeights = [50, 70, 55, 90, 65]
  const barHeightsR = [60, 80, 50, 95, 70]

  return (
    <div
      className="relative min-h-screen flex items-center justify-center py-10 overflow-hidden"
      style={{ background: 'var(--paper)' }}
    >
      {/* LEFT side decoration */}
      <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-80 pointer-events-none select-none overflow-hidden">
        {/* Large slide — back */}
        <div
          className="absolute"
          style={{
            width: 220,
            height: 124,
            top: '26%',
            left: -44,
            borderRadius: 10,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            transform: 'rotate(-12deg)',
            opacity: 0.75,
          }}
        >
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 6, width: 80, borderRadius: 3, background: 'var(--line)' }} />
            <div style={{ height: 4, width: 110, borderRadius: 2, background: 'var(--line)', opacity: 0.55 }} />
            <div style={{ display: 'flex', gap: 5, marginTop: 8, alignItems: 'flex-end', height: 42 }}>
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    borderRadius: '2px 2px 0 0',
                    background: i === 3 ? 'var(--ink-muted)' : 'var(--line)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Small slide — front */}
        <div
          className="absolute"
          style={{
            width: 168,
            height: 95,
            top: '53%',
            left: 18,
            borderRadius: 8,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            transform: 'rotate(-5deg)',
            opacity: 0.6,
          }}
        >
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ height: 5, width: 60, borderRadius: 2, background: 'var(--line)' }} />
            <div style={{ height: 3, width: 88, borderRadius: 2, background: 'var(--line)', opacity: 0.5 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, marginTop: 6 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ height: 24, borderRadius: 4, background: 'var(--line)', opacity: 0.55 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Ghost outline slide — top */}
        <div
          className="absolute"
          style={{
            width: 138,
            height: 78,
            top: '7%',
            left: 22,
            borderRadius: 7,
            background: 'transparent',
            border: '1px solid var(--line)',
            transform: 'rotate(-9deg)',
            opacity: 0.4,
          }}
        />

        {/* Fade edge */}
        <div
          className="absolute inset-y-0 right-0 w-28"
          style={{ background: 'linear-gradient(to right, transparent, var(--paper))' }}
        />
      </div>

      {/* RIGHT side decoration */}
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-80 pointer-events-none select-none overflow-hidden">
        {/* Large slide — back */}
        <div
          className="absolute"
          style={{
            width: 220,
            height: 124,
            top: '20%',
            right: -38,
            borderRadius: 10,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            transform: 'rotate(11deg)',
            opacity: 0.75,
          }}
        >
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 6, width: 90, borderRadius: 3, background: 'var(--line)' }} />
            <div style={{ height: 4, width: 68, borderRadius: 2, background: 'var(--line)', opacity: 0.55 }} />
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[100, 78, 56].map((w, i) => (
                <div
                  key={i}
                  style={{
                    height: 4,
                    width: `${w}%`,
                    borderRadius: 2,
                    background: 'var(--line)',
                    opacity: 0.7 - i * 0.15,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Small slide — front */}
        <div
          className="absolute"
          style={{
            width: 160,
            height: 90,
            top: '56%',
            right: 22,
            borderRadius: 8,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            transform: 'rotate(6deg)',
            opacity: 0.6,
          }}
        >
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ height: 5, width: 52, borderRadius: 2, background: 'var(--line)' }} />
            <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'flex-end', height: 36 }}>
              {barHeightsR.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    borderRadius: '2px 2px 0 0',
                    background: i === 3 ? 'var(--ink-muted)' : 'var(--line)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Ghost outline slide — top */}
        <div
          className="absolute"
          style={{
            width: 130,
            height: 73,
            top: '5%',
            right: 26,
            borderRadius: 7,
            background: 'transparent',
            border: '1px solid var(--line)',
            transform: 'rotate(8deg)',
            opacity: 0.35,
          }}
        />

        {/* Fade edge */}
        <div
          className="absolute inset-y-0 left-0 w-28"
          style={{ background: 'linear-gradient(to left, transparent, var(--paper))' }}
        />
      </div>

      {/* CENTER card */}
      <div className="relative z-10 w-full max-w-[450px] mx-auto px-4">
        <div
          className="rounded-2xl p-8 sm:p-10"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            boxShadow:
              '0 2px 8px rgba(10,9,7,0.05), 0 12px 40px rgba(10,9,7,0.09)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
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

          <p className="eyebrow mb-3">— Sign up</p>
          <h1
            className="font-serif leading-[1.05] tracking-tightest text-[28px] sm:text-[34px]"
            style={{ color: 'var(--ink-strong)' }}
          >
            Create your account
          </h1>
          <p
            className="text-[14px] mt-3 mb-7 leading-relaxed"
            style={{ color: 'var(--ink-soft)' }}
          >
            No credit card required.
          </p>

          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-[13px]"
              style={{
                background: 'var(--accent-soft)',
                border: '1px solid var(--line)',
                color: 'var(--accent)',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block eyebrow mb-2" style={{ color: 'var(--ink-strong)' }}>
                Full name
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={set('full_name')}
                placeholder="Your name"
                className="w-full h-12 px-4 rounded-xl text-[14px] focus:outline-none transition-colors"
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink-strong)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--ink-strong)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
              />
            </div>

            <div>
              <label className="block eyebrow mb-2" style={{ color: 'var(--ink-strong)' }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@company.com"
                className="w-full h-12 px-4 rounded-xl text-[14px] focus:outline-none transition-colors"
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink-strong)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--ink-strong)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
              />
            </div>

            <div>
              <label className="block eyebrow mb-2" style={{ color: 'var(--ink-strong)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="At least 8 characters"
                  className="w-full h-12 pl-4 pr-12 rounded-xl text-[14px] focus:outline-none transition-colors"
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink-strong)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--ink-strong)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
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
                background: ready && !loading ? 'var(--ink-strong)' : 'rgba(10,9,7,0.15)',
                color: '#fff',
                cursor: ready && !loading ? 'pointer' : 'not-allowed',
                marginTop: 8,
              }}
              onMouseEnter={(e) => {
                if (ready && !loading) e.currentTarget.style.background = '#2A2620'
              }}
              onMouseLeave={(e) => {
                if (ready && !loading) e.currentTarget.style.background = 'var(--ink-strong)'
              }}
            >
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <p className="text-center text-[13px] mt-6" style={{ color: 'var(--ink-soft)' }}>
            Already have one?{' '}
            <Link
              to="/login"
              className="font-semibold underline-offset-4 hover:underline"
              style={{ color: 'var(--ink-strong)' }}
            >
              Sign in
            </Link>
          </p>

          <p className="text-center text-[11.5px] mt-4" style={{ color: 'var(--ink-faint)' }}>
            By signing up, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
