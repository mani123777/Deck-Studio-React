import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { templatesApi, generationApi, BASE_URL } from '../api/client'
import { AppLayout } from '../components/Layout/AppLayout'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import type { PreviewResponse, Slide, TemplateListItem, Theme } from '../types'
import { ArrowLeft, FileText, Loader2, Sparkles, Upload } from 'lucide-react'

type InputMode = 'file' | 'text'

/** Resolve thumbnail URL — relative paths (from backend) get the API base prepended. */
function resolveThumbnail(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

interface TemplateThumbnailProps {
  name: string
  thumbnailUrl: string
  totalSlides?: number
  isSelected: boolean
}

function TemplateThumbnail({ name, thumbnailUrl, totalSlides, isSelected }: TemplateThumbnailProps) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const resolved = resolveThumbnail(thumbnailUrl)
  const hasImage = !!resolved && !imgError

  return (
    <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
      {/* Actual thumbnail image */}
      {hasImage && (
        <img
          src={resolved}
          alt={name}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Fallback — shown when no image or while loading */}
      {(!hasImage || !imgLoaded) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <FileText size={16} className="text-white/50" />
          </div>
          {totalSlides && (
            <span className="text-white/40 text-[11px] font-medium">{totalSlides} slides</span>
          )}
        </div>
      )}

      {/* Slide count badge — shown over image when loaded */}
      {hasImage && imgLoaded && totalSlides && (
        <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {totalSlides} slides
        </div>
      )}

      {/* Selected overlay */}
      {isSelected && <div className="absolute inset-0 bg-purple-600/15" />}

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  )
}

// Slide canvas dimensions (must match SlidePreview)
const SLIDE_W = 1280
const SLIDE_H = 720

export function TemplatesPage() {
  const navigate = useNavigate()

  // Template list state
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  // Preview state
  const [previewSlides, setPreviewSlides] = useState<Slide[]>([])
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  // Content input state
  const [inputMode, setInputMode] = useState<InputMode>('file')
  const [file, setFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  const rightPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    templatesApi.list().then((r) => setTemplates(r.data))
  }, [])

  // Fetch preview whenever selected template changes
  useEffect(() => {
    if (!selected) {
      setPreviewSlides([])
      setPreviewTheme(null)
      return
    }

    setPreviewLoading(true)
    setPreviewError('')
    setPreviewSlides([])
    setPreviewTheme(null)

    templatesApi
      .getPreview(selected)
      .then((r) => {
        const data = r.data as PreviewResponse
        setPreviewSlides(data.slides ?? [])
        setPreviewTheme(data.theme ?? null)
      })
      .catch((err) => {
        setPreviewError(
          err.response?.data?.detail ?? 'Failed to load preview'
        )
      })
      .finally(() => setPreviewLoading(false))
  }, [selected])

  const selectedTemplate = templates.find((t) => t.id === selected)

  const canGenerate =
    selected && (inputMode === 'file' ? !!file : textContent.trim().length > 0)

  const handleGenerate = async () => {
    if (!selected || !canGenerate) return
    setGenError('')
    setGenerating(true)
    try {
      const payload =
        inputMode === 'file'
          ? file!
          : new File([textContent], 'content.txt', { type: 'text/plain' })
      const { data } = await generationApi.start(selected, payload)
      navigate(`/generate/${data.job_id}`)
    } catch (err: any) {
      setGenError(err.response?.data?.detail ?? 'Failed to start generation')
      setGenerating(false)
    }
  }

  // Scale that makes the slide fill the right panel minus padding
  // Right panel inner width ≈ 420 - 32 = 388 px
  const panelInnerW = 388
  const slideScale = parseFloat((panelInnerW / SLIDE_W).toFixed(4))

  return (
    <AppLayout>
      <div className="flex h-full" style={{ minHeight: 0 }}>
        {/* ----------------------------------------------------------------
            LEFT: template grid
        ---------------------------------------------------------------- */}
        <div className="flex-1 min-w-0 overflow-y-auto px-8 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Choose a template</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Click a template to preview all slides
              </p>
            </div>
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => {
              const isSelected = selected === t.id
              return (
                <div
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className={`group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 shadow-md shadow-purple-100'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {/* Thumbnail */}
                  <TemplateThumbnail
                    name={t.name}
                    thumbnailUrl={t.thumbnail_url}
                    totalSlides={t.metadata?.total_slides}
                    isSelected={isSelected}
                  />

                  {/* Info */}
                  <div className="p-3 bg-white">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ----------------------------------------------------------------
            RIGHT: Gamma-style preview panel — always reserve width, animate in
        ---------------------------------------------------------------- */}
        {selected && (
          <div
            ref={rightPanelRef}
            className="flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden"
            style={{ width: 420 }}
          >
            {/* Panel header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide font-medium">
                    {selectedTemplate?.category}
                  </p>
                  <h2 className="text-base font-bold text-gray-900 leading-tight truncate">
                    {selectedTemplate?.name}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedTemplate?.metadata?.total_slides ?? previewSlides.length} slides
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || generating}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-40 transition-colors"
                >
                  <Sparkles size={12} />
                  {generating ? 'Starting…' : 'Use this template'}
                </button>
              </div>
            </div>

            {/* Hero thumbnail — visible immediately, before slides load */}
            {selectedTemplate?.thumbnail_url && (
              <div className="flex-shrink-0 px-4 pt-3">
                <div className="w-full aspect-video rounded-lg overflow-hidden shadow-md bg-gray-900">
                  <img
                    src={resolveThumbnail(selectedTemplate.thumbnail_url)}
                    alt={selectedTemplate.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[11px] text-gray-400 text-center mt-1.5">Cover slide preview</p>
              </div>
            )}

            {/* Slide preview scroll area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 flex flex-col gap-4">
              {previewLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 size={28} className="text-purple-500 animate-spin" />
                  <p className="text-sm text-gray-500">Generating preview…</p>
                </div>
              )}

              {previewError && !previewLoading && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-600">{previewError}</p>
                </div>
              )}

              {!previewLoading && !previewError && previewSlides.length === 0 && (
                <div className="flex items-center justify-center py-16">
                  <p className="text-sm text-gray-400">No slides to preview.</p>
                </div>
              )}

              {previewSlides.map((slide, idx) => (
                <div key={slide.order ?? idx} className="flex flex-col gap-1.5">
                  {/* Slide number label */}
                  <p className="text-[11px] text-gray-400 font-medium pl-0.5">
                    {idx + 1}
                  </p>
                  {/* Rendered slide */}
                  <div
                    style={{
                      width: SLIDE_W * slideScale,
                      height: SLIDE_H * slideScale,
                      flexShrink: 0,
                      borderRadius: 6,
                      overflow: 'hidden',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                    }}
                  >
                    <SlidePreview
                      slide={slide}
                      theme={previewTheme ?? undefined}
                      scale={slideScale}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Content input section — pinned to bottom */}
            <div className="flex-shrink-0 border-t border-gray-100 bg-white px-5 pt-4 pb-5">
              <p className="text-sm font-semibold text-gray-900 mb-3">Add your content</p>

              {/* Mode toggle */}
              <div className="flex rounded-lg border border-gray-200 p-0.5 mb-3">
                <button
                  onClick={() => setInputMode('file')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    inputMode === 'file'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Upload size={12} />
                  Upload file
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    inputMode === 'text'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText size={12} />
                  Type content
                </button>
              </div>

              {inputMode === 'file' ? (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-colors mb-3">
                  <Upload size={18} className="text-gray-400 mb-1" />
                  <span className="text-xs font-medium text-gray-600">
                    {file ? file.name : 'Click to upload'}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">.txt · .docx · .pdf · max 10 MB</span>
                  <input
                    type="file"
                    accept=".txt,.docx,.pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              ) : (
                <div className="mb-3">
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste or type your content here…"
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-shadow"
                  />
                  <p className="text-xs text-gray-400 text-right mt-0.5">{textContent.length} chars</p>
                </div>
              )}

              {genError && (
                <p className="text-xs text-red-500 mb-2">{genError}</p>
              )}

              <button
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                <Sparkles size={14} />
                {generating ? 'Starting…' : 'Generate with AI'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
