import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Paperclip, Sparkles, X, Loader2, ArrowLeft } from 'lucide-react'

interface Props {
  onGenerate: (prompt: string, slideCount: number, file?: File) => void
  isGenerating: boolean
}

const SUGGESTIONS = [
  'A pitch deck for a B2B SaaS startup targeting HR teams',
  'Q3 2026 board update for an early-stage company',
  'Product launch deck for a new mobile app',
  'Customer success quarterly review',
]

const SLIDE_OPTIONS = [5, 7, 10, 12, 15, 20]

export function PromptScreen({ onGenerate, isGenerating }: Props) {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [slideCount, setSlideCount] = useState(10)
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const canSubmit = (prompt.trim().length > 0 || file !== null) && !isGenerating

  const handleSubmit = () => {
    if (!canSubmit) return
    onGenerate(
      prompt.trim() || `Create a presentation about ${file?.name}`,
      slideCount,
      file ?? undefined,
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--paper)' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-10 h-14"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 h-9 rounded-full text-[13px] transition-colors"
          style={{ color: 'var(--ink)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(10,9,7,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <p className="eyebrow">— New deck</p>
        <div className="w-[80px]" />
      </div>

      {/* Center column */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[680px]">
          {/* Editorial heading */}
          <div className="mb-10 text-center">
            <p className="eyebrow mb-4">— Generate from prompt</p>
            <h1
              className="font-serif leading-[1.0] tracking-tightest text-[40px] md:text-[52px]"
              style={{ color: 'var(--ink-strong)' }}
            >
              What's the
              <br />
              <span className="font-serif-italic" style={{ color: 'var(--accent)' }}>deck about?</span>
            </h1>
            <p
              className="text-[15px] mt-6 max-w-md mx-auto leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              Describe what you want to present, or attach a document. AI handles the rest.
            </p>
          </div>

          {/* Prompt card */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              boxShadow: '0 1px 1px rgba(15,14,12,0.04), 0 12px 32px -8px rgba(15,14,12,0.10)',
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="A pitch deck for Acme Corp's new B2B analytics platform launching in Q3…"
              disabled={isGenerating}
              rows={5}
              className="w-full p-7 text-[15px] resize-none outline-none leading-relaxed font-sans"
              style={{ color: 'var(--ink-strong)', background: 'transparent' }}
            />

            {/* File chip */}
            {file && (
              <div className="mx-7 mb-4 inline-flex items-center gap-2 h-8 px-3 rounded-full"
                style={{ background: 'var(--paper-2)', border: '1px solid var(--line)' }}
              >
                <Paperclip size={11} style={{ color: 'var(--ink-soft)' }} />
                <span className="text-[12px] truncate max-w-[200px]" style={{ color: 'var(--ink-strong)' }}>
                  {file.name}
                </span>
                <button
                  onClick={() => setFile(null)}
                  className="ml-1 transition-colors"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  <X size={11} />
                </button>
              </div>
            )}

            {/* Toolbar */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: '1px solid var(--line)', background: 'var(--surface-2)' }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 text-[12.5px] font-medium transition-colors h-8 px-2.5 rounded-lg"
                  style={{ color: 'var(--ink-soft)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
                    e.currentTarget.style.color = 'var(--ink-strong)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--ink-soft)'
                  }}
                >
                  <Paperclip size={13} />
                  Attach
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.docx,.pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />

                <span className="w-px h-4" style={{ background: 'var(--line)' }} />

                <div className="flex items-center gap-2">
                  <span className="eyebrow">Slides</span>
                  <select
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    disabled={isGenerating}
                    className="text-[12.5px] font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink-strong)',
                    }}
                  >
                    {SLIDE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex items-center gap-2 h-10 px-5 rounded-full text-[13px] font-semibold transition-all"
                style={{
                  background: canSubmit ? 'var(--ink-strong)' : 'rgba(10,9,7,0.15)',
                  color: '#fff',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={(e) => {
                  if (canSubmit) e.currentTarget.style.background = '#2A2620'
                }}
                onMouseLeave={(e) => {
                  if (canSubmit) e.currentTarget.style.background = 'var(--ink-strong)'
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mt-6">
            <p className="eyebrow mb-3 text-center">— Or try one</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] font-medium transition-all"
                  style={{ background: 'transparent', color: 'var(--ink-soft)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(10,9,7,0.05)'
                    e.currentTarget.style.color = 'var(--ink-strong)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--ink-soft)'
                  }}
                >
                  <Sparkles size={11} style={{ color: 'var(--accent)' }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
