import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.register(form.email, form.password, form.full_name)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      {/* Left — dark brand panel */}
      <div className="hidden lg:flex w-[480px] flex-shrink-0 flex-col justify-between p-10 relative overflow-hidden" style={{ background: '#0f172a' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#6366f1' }}>
            <span className="text-white font-bold text-[10px]">WAC</span>
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">WAC Deck Studio</span>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: '#f1f5f9' }}>
            Start creating<br />in minutes.
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: '#64748b' }}>
            Join thousands of professionals who use WAC Deck Studio to create impactful presentations effortlessly.
          </p>
        </div>

        <div className="relative z-10 flex gap-8">
          {[['Free', 'To start'], ['2 min', 'Setup'], ['AI', 'Powered']].map(([val, label]) => (
            <div key={label}>
              <p className="text-xl font-bold text-white">{val}</p>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#6366f1' }}>
              <span className="text-white font-bold text-[9px]">WAC</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">WAC Deck Studio</span>
          </div>

          <h2 className="text-[26px] font-bold text-gray-900 mb-1 tracking-tight">Create account</h2>
          <p className="text-sm text-gray-400 mb-8">Get started — it's free</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl border text-sm" style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#e11d48' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'full_name', label: 'Full name', type: 'text', placeholder: 'Your name' },
              { key: 'email', label: 'Email address', type: 'email', placeholder: 'you@company.com' },
              { key: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 characters' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{label}</label>
                <input
                  type={type}
                  required
                  minLength={key === 'password' ? 8 : undefined}
                  value={form[key as keyof typeof form]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white transition-all outline-none"
                  style={{ border: '1.5px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = '#6366f1'}
                  onBlur={e => (e.target as HTMLElement).style.borderColor = '#e2e8f0'}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all mt-2 disabled:opacity-60"
              style={{ background: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e293b'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0f172a'}
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <p className="text-[13px] text-center text-gray-400 mt-7">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#6366f1' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
