import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff } from 'lucide-react'

/* ── card catalogue ─────────────────────────────────────────────── */
type Card = { h: number; rot: number; node: React.ReactNode }

function mk(h: number, rot: number, node: React.ReactNode): Card {
  return { h, rot, node }
}

const CARDS: Card[] = [
  mk(220, -1.2,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(150deg,#0d0221 0%,#2d0b6b 100%)', position:'relative' }}>
      <div style={{ position:'absolute', top:'10%', right:'-10%', width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.5),transparent 65%)' }}/>
      <div style={{ position:'absolute', inset:0, padding:18 }}>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:8, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:14 }}>VOL 04 · 2025</p>
        <p style={{ color:'#fff', fontSize:38, fontWeight:900, lineHeight:0.95, letterSpacing:'-2px' }}>INSIDE</p>
        <div style={{ width:28, height:2, background:'#8b5cf6', borderRadius:2, marginTop:10, marginBottom:10 }}/>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:10 }}>Fall Edition</p>
      </div>
      <div style={{ position:'absolute', bottom:14, left:18, right:18 }}>
        {[65,45,55,38].map((w,i) => <div key={i} style={{ height:2, width:w, background:'rgba(255,255,255,0.15)', borderRadius:2, marginBottom:4 }}/>)}
      </div>
    </div>
  ),

  mk(175, 0.9,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'#ffffff', position:'relative' }}>
      <div style={{ padding:'16px 16px 10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:10 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:'#3b82f6', flexShrink:0 }}/>
          <p style={{ fontSize:8, color:'#94a3b8', letterSpacing:'1.5px', textTransform:'uppercase' }}>MANAGEMENT REPORT</p>
        </div>
        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:2 }}>Financial Risk</p>
        <p style={{ fontSize:10, color:'#64748b', marginBottom:12 }}>Q3 · FY 2025</p>
        <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:44 }}>
          {[55,72,40,88,60,70,50,82].map((v,i) => (
            <div key={i} style={{ flex:1, height:`${v}%`, background:i===3||i===7?'#3b82f6':'#e2e8f0', borderRadius:'2px 2px 0 0' }}/>
          ))}
        </div>
      </div>
      <div style={{ padding:'8px 16px 14px', display:'flex', gap:14 }}>
        {['12.4%','8.2%','5.6%'].map((v,i) => (
          <div key={i}><p style={{ fontSize:11, fontWeight:700, color:'#0f172a' }}>{v}</p><p style={{ fontSize:8, color:'#94a3b8' }}>Metric {i+1}</p></div>
        ))}
      </div>
    </div>
  ),

  mk(245, 1.6,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(155deg,#ea580c 0%,#dc2626 100%)', position:'relative' }}>
      <div style={{ position:'absolute', top:'-15%', left:'-15%', width:'130%', height:'130%', background:'radial-gradient(ellipse,rgba(255,255,255,0.10) 0%,transparent 60%)' }}/>
      <div style={{ position:'absolute', inset:0, padding:'20px 18px' }}>
        <p style={{ color:'rgba(255,255,255,0.65)', fontSize:8, letterSpacing:'2px', textTransform:'uppercase', marginBottom:12 }}>EVENT · 2025</p>
        <p style={{ color:'#fff', fontSize:10, fontWeight:500, marginBottom:3 }}>Piesta ng Pagkaing Pinoy</p>
        <p style={{ color:'#fff', fontSize:28, fontWeight:900, lineHeight:1.0, letterSpacing:'-0.5px', marginBottom:8 }}>SALO-SALO</p>
        <div style={{ width:24, height:2, background:'rgba(255,255,255,0.45)', borderRadius:2, marginBottom:10 }}/>
        <p style={{ color:'rgba(255,255,255,0.70)', fontSize:9, lineHeight:1.7 }}>Ika 15 ng Nobyembre<br/>Sa Kalye Maginhawa</p>
      </div>
    </div>
  ),

  mk(195, -0.7,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(145deg,#020617 0%,#0c1445 100%)', position:'relative' }}>
      <div style={{ position:'absolute', top:'18%', left:'50%', transform:'translateX(-50%)', width:80, height:80, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.55),transparent 70%)', filter:'blur(6px)' }}/>
      <div style={{ position:'absolute', bottom:16, left:16, right:16 }}>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:9, marginBottom:4 }}>Introducing</p>
        <p style={{ color:'#fff', fontSize:16, fontWeight:800, lineHeight:1.2, letterSpacing:'-0.3px' }}>The Product Launch</p>
        <div style={{ display:'flex', gap:4, marginTop:8 }}>
          {['rgba(99,102,241,0.8)','rgba(139,92,246,0.6)','rgba(168,85,247,0.4)'].map((c,i) => (
            <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:c }}/>
          ))}
        </div>
      </div>
    </div>
  ),

  mk(205, -1.8,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(160deg,#7c2d12 0%,#431407 100%)', position:'relative' }}>
      <div style={{ position:'absolute', bottom:'28%', left:'50%', transform:'translateX(-50%)', width:60, height:60, borderRadius:'50%', background:'radial-gradient(circle,#fbbf24,#f97316 50%,transparent 80%)' }}/>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'28%' }}>
        <svg viewBox="0 0 200 50" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
          <path d="M0,50 L0,35 L25,8 L55,28 L85,4 L115,22 L145,12 L175,28 L200,15 L200,50 Z" fill="#0f0500"/>
        </svg>
      </div>
      <div style={{ position:'absolute', inset:0, padding:'18px 16px' }}>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:8, letterSpacing:'3px', textTransform:'uppercase', marginBottom:10 }}>OUTDOORS</p>
        <p style={{ color:'#fff', fontSize:46, fontWeight:900, lineHeight:0.88, letterSpacing:'-2.5px' }}>wild</p>
      </div>
    </div>
  ),

  mk(170, 1.3,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(150deg,#0f172a 0%,#1e293b 100%)', position:'relative' }}>
      <div style={{ padding:'16px 16px 12px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:20, padding:'3px 9px', marginBottom:10 }}>
          <div style={{ width:4, height:4, borderRadius:'50%', background:'#6366f1' }}/>
          <span style={{ color:'#a5b4fc', fontSize:8, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase' }}>COMPANY REVIEW</span>
        </div>
        <p style={{ color:'#f1f5f9', fontSize:14, fontWeight:700, lineHeight:1.3, marginBottom:10 }}>Annual Report<br/>2024</p>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ width:34, height:34, borderRadius:'50%', border:'4px solid #6366f1', borderTopColor:'transparent', transform:'rotate(-45deg)', flexShrink:0 }}/>
          <div>
            {['#6366f1','#818cf8','#c7d2fe'].map((c,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:4, marginBottom:3 }}>
                <div style={{ width:4, height:4, borderRadius:1, background:c }}/>
                <div style={{ height:2, width:[32,22,16][i], background:c+'66', borderRadius:1 }}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),

  mk(195, -2.1,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(145deg,#1d4ed8 0%,#0ea5e9 100%)', position:'relative' }}>
      <div style={{ position:'absolute', top:'-25%', right:'-15%', width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>
      <div style={{ position:'absolute', inset:0, padding:'18px 16px' }}>
        <p style={{ color:'rgba(255,255,255,0.55)', fontSize:8, letterSpacing:'2px', textTransform:'uppercase', marginBottom:8 }}>2025 STRATEGY</p>
        <p style={{ color:'#fff', fontSize:20, fontWeight:900, lineHeight:1.1, letterSpacing:'-0.5px', marginBottom:12 }}>marketing<br/>report</p>
        <svg viewBox="0 0 110 36" style={{ width:'100%', height:36 }}>
          <defs>
            <linearGradient id="mg2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.30)"/>
              <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
            </linearGradient>
          </defs>
          <path d="M0,32 C15,28 28,8 46,13 C64,18 75,3 110,6 L110,36 L0,36 Z" fill="url(#mg2)"/>
          <path d="M0,32 C15,28 28,8 46,13 C64,18 75,3 110,6" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5"/>
        </svg>
      </div>
      <div style={{ position:'absolute', bottom:12, left:16, right:16, display:'flex', justifyContent:'space-between' }}>
        {['+24%','+18%','+31%'].map((v,i) => (
          <div key={i} style={{ textAlign:'center' }}>
            <p style={{ color:'rgba(255,255,255,0.90)', fontSize:10, fontWeight:700 }}>{v}</p>
            <p style={{ color:'rgba(255,255,255,0.40)', fontSize:8 }}>KPI {i+1}</p>
          </div>
        ))}
      </div>
    </div>
  ),

  mk(185, 0.7,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(150deg,#111827 0%,#1f2937 100%)', position:'relative' }}>
      <div style={{ padding:'16px 16px 12px' }}>
        <p style={{ color:'rgba(255,255,255,0.28)', fontSize:8, letterSpacing:'2px', textTransform:'uppercase', marginBottom:10 }}>DESIGN STUDIO</p>
        <p style={{ color:'#f9fafb', fontSize:13, fontWeight:700, lineHeight:1.3, marginBottom:12 }}>CONCEPT<br/>PROPOSAL</p>
        <div style={{ display:'flex', gap:4, marginBottom:10 }}>
          {['#8b5cf6','#ec4899','#f97316','#10b981','#3b82f6'].map((c,i) => (
            <div key={i} style={{ width:13, height:13, borderRadius:3, background:c }}/>
          ))}
        </div>
        {[52,38,46,30].map((w,i) => <div key={i} style={{ height:2, width:`${w}%`, background:'rgba(255,255,255,0.12)', borderRadius:2, marginBottom:5 }}/>)}
      </div>
    </div>
  ),

  mk(235, 2.0,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(160deg,#0c4a2a 0%,#15803d 100%)', position:'relative' }}>
      <div style={{ position:'absolute', top:'-15%', right:'-10%', width:120, height:120, borderRadius:'50%', background:'rgba(20,184,166,0.22)', filter:'blur(18px)' }}/>
      <div style={{ position:'absolute', inset:0, padding:'18px 16px' }}>
        <p style={{ color:'rgba(255,255,255,0.40)', fontSize:8, letterSpacing:'2px', textTransform:'uppercase', marginBottom:10 }}>AGENCY DECK</p>
        <p style={{ color:'#fff', fontSize:18, fontWeight:800, lineHeight:1.2, letterSpacing:'-0.3px', marginBottom:12 }}>creative<br/>strategy</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4, width:76 }}>
          {['rgba(20,184,166,0.8)','rgba(255,255,255,0.55)','rgba(20,184,166,0.4)','rgba(255,255,255,0.25)',
            'rgba(255,255,255,0.18)','rgba(20,184,166,0.6)','rgba(255,255,255,0.35)','rgba(20,184,166,0.25)'].map((c,i) => (
            <div key={i} style={{ width:'100%', paddingBottom:'100%', background:c, borderRadius:3 }}/>
          ))}
        </div>
      </div>
    </div>
  ),

  mk(180, -1.0,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(150deg,#7c3aed 0%,#c084fc 100%)', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 70%,rgba(255,255,255,0.12),transparent 60%)' }}/>
      <div style={{ position:'absolute', inset:0, padding:'16px 16px' }}>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:8, letterSpacing:'2px', textTransform:'uppercase', marginBottom:10 }}>CLOSING SLIDE</p>
        <p style={{ color:'#fff', fontSize:26, fontWeight:800, letterSpacing:'-0.5px', lineHeight:1.2 }}>Thank<br/>You!</p>
      </div>
      <div style={{ position:'absolute', bottom:14, left:16, right:16 }}>
        <div style={{ display:'flex', gap:3 }}>
          {['rgba(255,255,255,0.50)','rgba(255,255,255,0.28)','rgba(255,255,255,0.16)'].map((c,i) => (
            <div key={i} style={{ flex:1, height:3, background:c, borderRadius:2 }}/>
          ))}
        </div>
      </div>
    </div>
  ),

  mk(190, 1.4,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(165deg,#0a0a12 0%,#1a0a00 55%,#2d1500 100%)', position:'relative' }}>
      <div style={{ position:'absolute', bottom:'-5%', left:'30%', width:100, height:100, background:'radial-gradient(circle,rgba(234,88,12,0.32),transparent 60%)', filter:'blur(8px)' }}/>
      <div style={{ position:'absolute', inset:0, padding:'20px 16px' }}>
        <p style={{ color:'rgba(255,255,255,0.28)', fontSize:8, letterSpacing:'3px', textTransform:'uppercase', marginBottom:14 }}>OCTOBER 2024</p>
        <p style={{ color:'rgba(255,255,255,0.65)', fontSize:10, fontWeight:400, marginBottom:3 }}>THE</p>
        <p style={{ color:'#fff', fontSize:26, fontWeight:900, lineHeight:0.95, letterSpacing:'-0.5px' }}>LAST<br/>VISITOR</p>
      </div>
    </div>
  ),

  mk(175, -1.5,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(150deg,#0f172a 0%,#1e1b4b 100%)', position:'relative' }}>
      <div style={{ padding:'16px 16px 12px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(239,68,68,0.14)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:20, padding:'3px 9px', marginBottom:10 }}>
          <div style={{ width:4, height:4, borderRadius:'50%', background:'#ef4444' }}/>
          <span style={{ color:'#fca5a5', fontSize:8, fontWeight:600, letterSpacing:'1px' }}>LIVE</span>
        </div>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:8, letterSpacing:'1px', textTransform:'uppercase', marginBottom:5 }}>new podcast alert</p>
        <p style={{ color:'#f8fafc', fontSize:12, fontWeight:700, lineHeight:1.3, marginBottom:10 }}>@brandname<br/>talks strategy</p>
        <div style={{ display:'flex', alignItems:'center', gap:2, height:20 }}>
          {[3,7,12,18,10,16,22,14,8,20,12,7,16,10,5,14,20,8,12,7].map((h,i) => (
            <div key={i} style={{ width:3, height:h, borderRadius:2, background:i<10?'#6366f1':'rgba(99,102,241,0.28)', flexShrink:0 }}/>
          ))}
        </div>
      </div>
    </div>
  ),

  mk(215, 0.8,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(150deg,#1a1035 0%,#2e1065 100%)', position:'relative' }}>
      <div style={{ position:'absolute', top:'20%', right:'15%', width:70, height:70, borderRadius:'50%', background:'radial-gradient(circle,rgba(251,191,36,0.40),transparent 65%)' }}/>
      <div style={{ position:'absolute', inset:0, padding:'18px 16px' }}>
        <p style={{ color:'rgba(255,255,255,0.30)', fontSize:8, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:10 }}>INVESTOR DECK</p>
        <p style={{ color:'#fff', fontSize:16, fontWeight:800, lineHeight:1.25, letterSpacing:'-0.3px', marginBottom:14 }}>Series B<br/>Pitch 2025</p>
        <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:42 }}>
          {[40,55,35,70,50,80,60,90].map((v,i) => (
            <div key={i} style={{ flex:1, height:`${v}%`, background:`rgba(251,191,36,${0.2+i*0.08})`, borderRadius:'2px 2px 0 0' }}/>
          ))}
        </div>
      </div>
      <div style={{ position:'absolute', bottom:12, left:16 }}>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:8 }}>22 slides</p>
      </div>
    </div>
  ),

  mk(200, -2.0,
    <div style={{ height:'100%', borderRadius:14, overflow:'hidden', background:'linear-gradient(150deg,#064e3b 0%,#065f46 100%)', position:'relative' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'45%', background:'linear-gradient(180deg,rgba(255,255,255,0.06),transparent)' }}/>
      <div style={{ position:'absolute', inset:0, padding:'18px 16px' }}>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:8, letterSpacing:'3px', textTransform:'uppercase', marginBottom:12 }}>EDITORIAL</p>
        <p style={{ color:'rgba(255,255,255,0.90)', fontSize:22, fontWeight:900, letterSpacing:'2px', textTransform:'uppercase' }}>SOURCE</p>
        <div style={{ marginTop:14 }}>
          {[52,36,44].map((w,i) => <div key={i} style={{ height:2, width:`${w}%`, background:'rgba(255,255,255,0.18)', borderRadius:2, marginBottom:5 }}/>)}
        </div>
      </div>
    </div>
  ),
]

/* column assignments — each col gets a different rotation of the 14 cards */
const COLS = [
  [0,1,2,3,4,5,6,7,8,9,10,11,12,13],
  [7,8,9,10,11,12,13,0,1,2,3,4,5,6],
  [3,4,5,6,7,8,9,10,11,12,13,0,1,2],
  [10,11,12,13,0,1,2,3,4,5,6,7,8,9],
]

const CFG = [
  { spd:38, dly:-2  },
  { spd:34, dly:-14 },
  { spd:40, dly:-24 },
  { spd:36, dly:-32 },
]

/* ── page ────────────────────────────────────────────────────────── */
export function LoginPage() {
  const navigate   = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [show,     setShow]     = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const ready = email.trim().length > 0 && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setError(''); setLoading(true)
    try {
      const { data: tokens } = await authApi.login(email, password)
      localStorage.setItem('access_token', tokens.access_token)
      const { data: user } = await authApi.me()
      storeLogin(tokens.access_token, tokens.refresh_token, user)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: hidden; height: 100%; background: #ffffff; }

        @keyframes rise {
          from { transform: translateY(0); }
          to   { transform: translateY(-33.333%); }
        }
        .col-track {
          display: flex; flex-direction: column; gap: 10px;
          will-change: transform;
        }
        .field {
          width: 100%; height: 44px; padding: 0 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px; outline: none;
          color: #0f172a; font-size: 14px; font-family: inherit;
          transition: border-color .15s, background .15s, box-shadow .15s;
        }
        .field::placeholder { color: #94a3b8; }
        .field:focus {
          border-color: #6366f1;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.10);
        }
        .right-panel { display: none; }
        @media (min-width: 768px) { .right-panel { display: block; } }
      `}</style>

      <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter',-apple-system,sans-serif", background:'#f1f5f9' }}>

        {/* ── LEFT FORM ───────────────────────────────────────────── */}
        <div style={{
          width: '42%', minWidth: 420, flexShrink: 0,
          background: '#ffffff',
          display: 'flex', flexDirection: 'column',
          zIndex: 2,
          boxShadow: '4px 0 32px rgba(0,0,0,0.08)',
        }}>

          {/* logo */}
          <div style={{ padding:'32px 48px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:32, height:32, borderRadius:8, flexShrink:0,
                background:'#6366f1',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <span style={{ color:'#fff', fontWeight:800, fontSize:9, letterSpacing:'0.2px' }}>WAC</span>
              </div>
              <span style={{ color:'#0f172a', fontWeight:600, fontSize:14, letterSpacing:'-0.2px' }}>WAC Deck Studio</span>
            </div>
          </div>

          {/* form */}
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 48px' }}>
            <div style={{ width:'100%', maxWidth:380 }}>

              <h1 style={{ fontSize:28, fontWeight:700, color:'#0f172a', letterSpacing:'-0.6px', lineHeight:1.2, marginBottom:6 }}>
                Sign in to your account
              </h1>
              <p style={{ fontSize:14, color:'#64748b', marginBottom:36, lineHeight:1.5 }}>
                Welcome back — enter your details below.
              </p>

              {error && (
                <div style={{ marginBottom:20, padding:'12px 14px', borderRadius:8, background:'#fff1f2', color:'#dc2626', border:'1px solid #fecaca', fontSize:13, lineHeight:1.4 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom:18 }}>
                  <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#374151', marginBottom:6 }}>
                    Email address
                  </label>
                  <input
                    className="field" type="email" value={email}
                    placeholder="you@company.com"
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <label style={{ fontSize:13, fontWeight:500, color:'#374151' }}>Password</label>
                    <a href="#" style={{ fontSize:13, color:'#6366f1', textDecoration:'none', fontWeight:500 }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration='underline'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration='none'}
                    >Forgot password?</a>
                  </div>
                  <div style={{ position:'relative' }}>
                    <input
                      className="field" type={show ? 'text' : 'password'}
                      value={password} placeholder="••••••••"
                      onChange={e => setPassword(e.target.value)}
                      style={{ paddingRight:44 }}
                    />
                    <button
                      type="button" onClick={() => setShow(!show)}
                      style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', alignItems:'center', padding:0 }}
                    >
                      {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={!ready || loading}
                  style={{
                    width:'100%', height:44, borderRadius:8, border:'none',
                    background: ready && !loading ? '#6366f1' : '#f1f5f9',
                    color: ready && !loading ? '#ffffff' : '#9ca3af',
                    fontSize:14, fontWeight:600,
                    cursor: ready && !loading ? 'pointer' : 'default',
                    transition:'background .15s, box-shadow .15s, transform .1s',
                    marginTop:24,
                    letterSpacing: '-0.1px',
                  }}
                  onMouseEnter={e => { if (ready && !loading) { const el = e.currentTarget as HTMLElement; el.style.background='#4f46e5'; el.style.transform='translateY(-1px)'; el.style.boxShadow='0 4px 14px rgba(99,102,241,0.4)' } }}
                  onMouseLeave={e => { if (ready && !loading) { const el = e.currentTarget as HTMLElement; el.style.background='#6366f1'; el.style.transform='translateY(0)'; el.style.boxShadow='none' } }}
                >
                  {loading ? 'Signing in…' : 'Continue'}
                </button>
              </form>

              <p style={{ textAlign:'center', fontSize:13, color:'#6b7280', marginTop:24 }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color:'#6366f1', fontWeight:500, textDecoration:'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration='underline'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration='none'}
                >Sign up</Link>
              </p>
            </div>
          </div>

          <div style={{ padding:'20px 48px' }}>
            <p style={{ fontSize:12, color:'#d1d5db' }}>&copy; 2025 WAC Deck Studio</p>
          </div>
        </div>

        {/* ── RIGHT CARD WALL ─────────────────────────────────────── */}
        <div className="right-panel" style={{
          flex:1, overflow:'hidden', position:'relative', background:'#f1f5f9',
        }}>
          {/* dot grid */}
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:'radial-gradient(rgba(15,23,42,0.07) 1px, transparent 1px)',
            backgroundSize:'26px 26px', pointerEvents:'none', zIndex:0,
          }}/>

          {/* sloped card wall */}
          <div style={{
            position:'absolute',
            inset:'-25% -10%',
            display:'flex', gap:10, padding:'0 12px',
            transform:'rotate(-11deg)',
            transformOrigin:'center center',
            zIndex:1,
          }}>
            {COLS.map((indices, ci) => {
              const { spd, dly } = CFG[ci]
              const col = indices.map(i => CARDS[i])
              const items = [...col, ...col, ...col]
              return (
                <div key={ci} style={{ flex:1, overflow:'hidden', height:'100%' }}>
                  <div className="col-track" style={{ animation:`rise ${spd}s linear ${dly}s infinite` }}>
                    {items.map((card, i) => (
                      <div key={i} style={{ transform:`rotate(${card.rot}deg)`, transformOrigin:'center', flexShrink:0, height:card.h }}>
                        {card.node}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* fade edges */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:2,
            background:`linear-gradient(to bottom, #f1f5f9 0%, transparent 18%, transparent 82%, #f1f5f9 100%)` }}/>
        </div>

      </div>
    </>
  )
}
