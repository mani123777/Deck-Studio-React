import { useRef, useState } from 'react'
import { Paperclip, Sparkles, X } from 'lucide-react'

interface Props {
  onGenerate: (prompt: string, slideCount: number, file?: File) => void
  isGenerating: boolean
}

export function PromptScreen({ onGenerate, isGenerating }: Props) {
  const [prompt, setPrompt] = useState('')
  const [slideCount, setSlideCount] = useState(10)
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const canSubmit = (prompt.trim().length > 0 || file !== null) && !isGenerating

  const handleSubmit = () => {
    if (!canSubmit) return
    onGenerate(prompt.trim() || `Create a presentation about ${file?.name}`, slideCount, file ?? undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles size={28} className="text-indigo-400" />
            <span className="text-white text-3xl font-bold tracking-tight">New Presentation</span>
          </div>
          <p className="text-slate-400 text-base">Describe what you want to present, or attach a document.</p>
        </div>

        {/* Input card */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. A pitch deck for a B2B SaaS startup targeting HR teams..."
            disabled={isGenerating}
            rows={5}
            className="w-full bg-transparent text-white placeholder-slate-500 text-[15px] p-5 resize-none outline-none leading-relaxed"
          />

          {/* File chip */}
          {file && (
            <div className="mx-5 mb-3 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/40 rounded-lg text-indigo-300 text-sm">
              <Paperclip size={13} />
              <span className="max-w-[200px] truncate">{file.name}</span>
              <button onClick={() => setFile(null)} className="ml-1 hover:text-white">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <div className="flex items-center gap-3">
              {/* File attach */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={isGenerating}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
              >
                <Paperclip size={15} />
                <span>Attach</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.docx,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />

              {/* Slide count */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">Slides</span>
                <select
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  disabled={isGenerating}
                  className="bg-[#0f172a] border border-slate-600 text-white text-sm rounded-lg px-2 py-1 outline-none"
                >
                  {[5, 6, 7, 8, 9, 10, 12, 15, 20].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canSubmit ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#334155' }}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          Tip: Press ⌘ + Enter to generate
        </p>
      </div>
    </div>
  )
}
