import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Play, Save } from 'lucide-react'
import { generationApi, presentationsApi } from '../api/client'
import type { Slide, Theme, Block } from '../types'
import { PromptScreen } from '../components/Create/PromptScreen'
import { OutlinePanel } from '../components/Create/OutlinePanel'
import { BlockEditorPanel } from '../components/Create/BlockEditorPanel'
import { SlidePreview } from '../components/Presentation/SlidePreview'

type Phase = 'prompt' | 'generating' | 'editor'

// Fixed panel widths — canvas scale is stable regardless of block selection
const LEFT_W  = 192  // slide thumbnail strip
const RIGHT_W = 264  // property panel
const CANVAS_PAD = 56

export function CreatePage() {
  const navigate = useNavigate()

  const [phase, setPhase]                   = useState<Phase>('prompt')
  const [slides, setSlides]                 = useState<Slide[]>([])
  const [theme, setTheme]                   = useState<Theme | null>(null)
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0)
  const [selectedBlockId, setSelectedBlockId]       = useState<string | null>(null)
  const [editingBlockId, setEditingBlockId]         = useState<string | null>(null)
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  const handleGenerate = async (prompt: string, slideCount: number, file?: File) => {
    setPhase('generating')
    setError(null)
    try {
      const res = await generationApi.generateSync(prompt, slideCount, file)
      setSlides(res.data.slides)
      setTheme(res.data.theme)
      setSelectedSlideIndex(0)
      setSelectedBlockId(null)
      setEditingBlockId(null)
      setPhase('editor')
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Generation failed. Please try again.')
      setPhase('prompt')
    }
  }

  const handleBlockClick = useCallback((blockId: string) => {
    if (!blockId) {
      setSelectedBlockId(null)
      setEditingBlockId(null)
      return
    }
    setSelectedBlockId(blockId)
    setEditingBlockId(null)
  }, [])

  const handleBlockDoubleClick = useCallback((blockId: string) => {
    setSelectedBlockId(blockId)
    setEditingBlockId(blockId)
  }, [])

  const handleBlockContentChange = useCallback(
    (blockId: string, newContent: string) => {
      setSlides((prev) =>
        prev.map((slide, idx) => {
          if (idx !== selectedSlideIndex) return slide
          return {
            ...slide,
            blocks: slide.blocks.map((b) =>
              b.id === blockId ? { ...b, content: newContent } : b,
            ),
          }
        }),
      )
    },
    [selectedSlideIndex],
  )

  const handleBlockPanelChange = useCallback(
    (patch: Partial<Block>) => {
      if (!selectedBlockId) return
      setSlides((prev) =>
        prev.map((slide, idx) => {
          if (idx !== selectedSlideIndex) return slide
          return {
            ...slide,
            blocks: slide.blocks.map((b) => {
              if (b.id !== selectedBlockId) return b
              return {
                ...b,
                ...(patch.content  !== undefined ? { content: patch.content }                               : {}),
                ...(patch.styling  !== undefined ? { styling: { ...b.styling, ...patch.styling } }          : {}),
              }
            }),
          }
        }),
      )
    },
    [selectedBlockId, selectedSlideIndex],
  )

  const handleSave = async () => {
    if (!theme || slides.length === 0) return
    setSaving(true)
    try {
      const titleBlock = slides[0]?.blocks.find((b) => b.type === 'title' || b.type === 'heading')
      const title = titleBlock?.content?.split('\n')[0] || 'My Presentation'
      const res = await presentationsApi.create({ title, slides: slides as object[], theme_id: theme.id })
      navigate(`/presentations/${res.data.id}`)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (phase === 'prompt' || phase === 'generating') {
    return (
      <>
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-5 py-3 rounded-xl text-sm shadow-lg">
            {error}
          </div>
        )}
        <PromptScreen onGenerate={handleGenerate} isGenerating={phase === 'generating'} />
      </>
    )
  }

  const currentSlide = slides[selectedSlideIndex]
  const selectedBlock = currentSlide?.blocks.find((b) => b.id === selectedBlockId) ?? null

  if (!currentSlide || !theme) return null

  const presentationTitle =
    slides[0]?.blocks.find((b) => b.type === 'title' || b.type === 'heading')?.content?.split('\n')[0] || 'Untitled'

  // Fixed scale — doesn't jump when panel opens/closes
  const availableW = window.innerWidth - LEFT_W - RIGHT_W - CANVAS_PAD
  const previewScale = Math.min(Math.max(availableW / 1280, 0.35), 0.88)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0b1120' }}>

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ height: 52, borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0d1526' }}
      >
        {/* Left: title */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <span className="text-white text-sm font-medium truncate max-w-xs">{presentationTitle}</span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
          >
            {slides.length} slides
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
          >
            <Play size={13} />
            Present
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: saving ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            <Save size={13} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN AREA ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Slide strip */}
        <div
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{ width: LEFT_W, borderRight: '1px solid rgba(255,255,255,0.07)', background: '#0d1526' }}
        >
          <OutlinePanel
            slides={slides}
            theme={theme}
            selectedIndex={selectedSlideIndex}
            onSelect={(idx) => {
              setSelectedSlideIndex(idx)
              setSelectedBlockId(null)
              setEditingBlockId(null)
            }}
          />
        </div>

        {/* CENTER — Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas area */}
          <div
            className="flex-1 flex items-center justify-center relative"
            style={{ background: '#070d1a' }}
            onClick={() => { setSelectedBlockId(null); setEditingBlockId(null) }}
          >
            {/* Slide label */}
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 text-[11px] font-medium px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}
            >
              Slide {selectedSlideIndex + 1} of {slides.length}
            </div>

            <SlidePreview
              slide={currentSlide}
              theme={theme}
              scale={previewScale}
              selectedBlockId={selectedBlockId}
              editingBlockId={editingBlockId}
              onBlockClick={handleBlockClick}
              onBlockDoubleClick={handleBlockDoubleClick}
              onBlockContentChange={handleBlockContentChange}
            />
          </div>

          {/* Bottom navigation */}
          <div
            className="flex items-center justify-center gap-4 flex-shrink-0"
            style={{ height: 52, borderTop: '1px solid rgba(255,255,255,0.07)', background: '#0d1526' }}
          >
            <button
              onClick={() => { setSelectedSlideIndex((i) => Math.max(0, i - 1)); setSelectedBlockId(null) }}
              disabled={selectedSlideIndex === 0}
              className="p-1.5 rounded-lg transition-all disabled:opacity-25"
              style={{ color: '#64748b' }}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedSlideIndex(idx); setSelectedBlockId(null) }}
                  className="rounded-full transition-all"
                  style={{
                    width: idx === selectedSlideIndex ? 20 : 6,
                    height: 6,
                    background: idx === selectedSlideIndex ? '#6366f1' : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => { setSelectedSlideIndex((i) => Math.min(slides.length - 1, i + 1)); setSelectedBlockId(null) }}
              disabled={selectedSlideIndex === slides.length - 1}
              className="p-1.5 rounded-lg transition-all disabled:opacity-25"
              style={{ color: '#64748b' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* RIGHT — Property panel */}
        <div className="flex-shrink-0 flex flex-col overflow-hidden">
          <BlockEditorPanel
            block={selectedBlock}
            theme={theme}
            onClose={() => { setSelectedBlockId(null); setEditingBlockId(null) }}
            onChange={handleBlockPanelChange}
          />
        </div>

      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-5 py-3 rounded-xl text-sm shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
}
