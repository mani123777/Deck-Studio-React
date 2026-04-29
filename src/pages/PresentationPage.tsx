import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { presentationsApi, exportApi } from '../api/client'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import { PropertyPanel } from '../components/Presentation/SlideEditor'
import { ThemePanel } from '../components/Presentation/ThemePanel'
import { getThemeById } from '../data/themes'
import type { ThemePreset } from '../data/themes'
import type { PresentationDetail, Slide, Styling, Theme } from '../types'

type SaveStatus = 'idle' | 'saving' | 'saved'
type CtxMenu = { index: number; x: number; y: number } | null
type ExportReady = { jobId: string } | null

// ── Helpers ───────────────────────────────────────────────────────────────────

function presetToTheme(p: ThemePreset): Theme {
  return {
    id: p.id,
    name: p.name,
    colors: {
      primary:    p.colors.heading,
      secondary:  p.colors.surface,
      accent:     p.colors.accent,
      background: p.colors.background,
      text:       p.colors.body,
    },
    fonts: {
      heading: { family: p.fonts.heading, size: 52, weight: 800 },
      body:    { family: p.fonts.body,    size: 16, weight: 400 },
      caption: { family: p.fonts.body,    size: 12, weight: 400 },
    },
  }
}

function applyPresetToSlides(slides: Slide[], t: ThemePreset): Slide[] {
  return slides.map((slide) => ({
    ...slide,
    background: { type: 'color' as const, value: t.colors.background },
    blocks: slide.blocks.map((block) => {
      switch (block.type) {
        case 'title':
        case 'heading':
          return { ...block, styling: { ...block.styling, color: t.colors.heading, font_family: t.fonts.heading } }
        case 'subtitle':
        case 'body':
        case 'text':
        case 'caption':
        case 'quote':
        case 'bullet':
          return { ...block, styling: { ...block.styling, color: t.colors.body, font_family: t.fonts.body } }
        case 'badge':
          return { ...block, styling: { ...block.styling, color: t.colors.accent } }
        case 'shape':
          return { ...block, styling: { ...block.styling, background_color: t.colors.accent, color: t.colors.accent } }
        case 'panel':
          return { ...block, styling: { ...block.styling, background_color: t.colors.surface } }
        case 'card':
          return { ...block, styling: { ...block.styling, background_color: t.colors.surface, color: t.colors.heading } }
        case 'stat':
          return { ...block, styling: { ...block.styling, color: t.colors.accent } }
        case 'process_circle':
          return { ...block, styling: { ...block.styling, background_color: t.colors.accent, color: '#ffffff' } }
        default:
          return { ...block, styling: { ...block.styling, color: t.colors.body } }
      }
    }),
  }))
}

function getCanvasBg(hex: string): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#111118'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? '#c4c8d0' : '#111118'
}

function makeBlankSlide(order: number, theme: ThemePreset): Slide {
  return {
    order,
    type: 'content',
    background: { type: 'color', value: theme.colors.background },
    blocks: [
      {
        id: crypto.randomUUID(),
        type: 'title',
        content: 'New Slide',
        position: { x: 80, y: 260, w: 1120, h: 120 },
        styling: {
          font_family: theme.fonts.heading,
          font_size: 52,
          font_weight: 800,
          color: theme.colors.heading,
          background_color: 'transparent',
          text_align: 'left',
        },
      },
    ],
  }
}

// ── PresentationPage ──────────────────────────────────────────────────────────

export function PresentationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [presentation, setPresentation] = useState<PresentationDetail | null>(null)
  const [slides, setSlides]             = useState<Slide[]>([])
  const [activeSlide, setActiveSlide]   = useState(0)
  const [editMode, setEditMode]         = useState(false)
  const [themeOpen, setThemeOpen]       = useState(false)
  const [saveStatus, setSaveStatus]     = useState<SaveStatus>('idle')
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [editingBlockId, setEditingBlockId]   = useState<string | null>(null)
  const [activeTheme, setActiveTheme]   = useState<ThemePreset>(getThemeById('vortex'))
  const [canvasScale, setCanvasScale]   = useState(0.72)

  // Context menu for slide strip
  const [ctxMenu, setCtxMenu] = useState<CtxMenu>(null)

  // Download modal
  const [downloadOpen, setDownloadOpen]   = useState(false)
  const [exporting, setExporting]         = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportReady, setExportReady]     = useState<ExportReady>(null)
  const [exportError, setExportError]     = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const centerRef   = useRef<HTMLDivElement>(null)

  // Load presentation
  useEffect(() => {
    if (!id) return
    presentationsApi.get(id).then((r) => {
      setPresentation(r.data)
      setSlides(r.data.slides)
      setActiveTheme(getThemeById(r.data.theme_id))
    })
  }, [id])

  // Dynamic canvas scale
  useEffect(() => {
    const compute = () => {
      if (!centerRef.current) return
      const { clientWidth, clientHeight } = centerRef.current
      const scaleW = (clientWidth  - 80) / 1280
      const scaleH = (clientHeight - 80) / 720
      setCanvasScale(Math.min(scaleW, scaleH, 1))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [ctxMenu])

  // Auto-save
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (!id) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaveStatus('saving')
    debounceRef.current = setTimeout(async () => {
      try {
        await presentationsApi.update(id, { slides })
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('idle')
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [slides, id])

  // ── Block interactions ──────────────────────────────────────────────────────
  const handleBlockClick = useCallback((blockId: string) => {
    if (!editMode) return
    if (!blockId) { setSelectedBlockId(null); setEditingBlockId(null); return }
    setSelectedBlockId(blockId)
    setEditingBlockId(null)
  }, [editMode])

  const handleBlockDoubleClick = useCallback((blockId: string) => {
    if (!editMode) return
    setEditingBlockId(blockId)
  }, [editMode])

  const handleBlockContentChange = useCallback((blockId: string, content: string) => {
    setSlides((prev) =>
      prev.map((s, i) =>
        i !== activeSlide ? s : {
          ...s,
          blocks: s.blocks.map((b) => b.id === blockId ? { ...b, content } : b),
        }
      )
    )
  }, [activeSlide])

  const updateStyling = (blockId: string, updates: Partial<Styling>) => {
    setSlides((prev) =>
      prev.map((s, i) =>
        i !== activeSlide ? s : {
          ...s,
          blocks: s.blocks.map((b) =>
            b.id === blockId ? { ...b, styling: { ...b.styling, ...updates } } : b
          ),
        }
      )
    )
  }

  const updateContent = (blockId: string, content: string) => {
    setSlides((prev) =>
      prev.map((s, i) =>
        i !== activeSlide ? s : {
          ...s,
          blocks: s.blocks.map((b) => b.id === blockId ? { ...b, content } : b),
        }
      )
    )
  }

  // ── Theme ───────────────────────────────────────────────────────────────────
  const handleApplyTheme = (theme: ThemePreset) => {
    setActiveTheme(theme)
    setSlides((prev) => applyPresetToSlides(prev, theme))
    setThemeOpen(false)
    if (id) {
      presentationsApi.update(id, { theme_id: theme.id })
    }
  }

  // ── Slide management ────────────────────────────────────────────────────────
  const addSlide = () => {
    const newSlide = makeBlankSlide(slides.length + 1, activeTheme)
    setSlides((prev) => [...prev, newSlide])
    setActiveSlide(slides.length)
    setSelectedBlockId(null)
    setEditingBlockId(null)
  }

  const duplicateSlide = (index: number) => {
    const src = slides[index]
    const dup: Slide = {
      ...src,
      order: index + 2,
      blocks: src.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
    }
    const next = [
      ...slides.slice(0, index + 1),
      dup,
      ...slides.slice(index + 1),
    ].map((s, i) => ({ ...s, order: i + 1 }))
    setSlides(next)
    setActiveSlide(index + 1)
    setCtxMenu(null)
  }

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) { setCtxMenu(null); return }
    const next = slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))
    setSlides(next)
    setActiveSlide(Math.min(activeSlide, next.length - 1))
    setCtxMenu(null)
  }

  const moveSlide = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= slides.length) return
    setSlides((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((s, i) => ({ ...s, order: i + 1 }))
    })
    if (activeSlide === index) setActiveSlide(target)
    else if (activeSlide === target) setActiveSlide(index)
    setCtxMenu(null)
  }

  // ── Export / Download ───────────────────────────────────────────────────────
  const handleDownload = async (format: 'pptx' | 'html') => {
    if (!id) return
    setDownloadOpen(false)
    setExporting(true)
    setExportReady(null)
    setExportError(null)
    setExportProgress(0)
    try {
      const { data } = await exportApi.start(id, format)
      const poll = setInterval(async () => {
        const { data: s } = await exportApi.status(data.job_id)
        setExportProgress(s.progress ?? 0)
        if (s.status === 'completed') {
          clearInterval(poll)
          setExporting(false)
          setExportReady({ jobId: data.job_id })
        } else if (s.status === 'failed') {
          clearInterval(poll)
          setExporting(false)
          setExportError(s.error_message ?? 'Export failed')
        }
      }, 2000)
    } catch {
      setExporting(false)
      setExportError('Export failed. Please try again.')
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const themeObj      = presetToTheme(activeTheme)
  const canvasBg      = getCanvasBg(activeTheme.colors.background)
  const currentSlide  = slides[activeSlide]
  const selectedBlock = currentSlide?.blocks.find((b) => b.id === selectedBlockId) ?? null

  if (!presentation) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#13131f', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: canvasBg }}>

      {/* ── Toolbar ── */}
      <div style={{
        height: 52, flexShrink: 0, zIndex: 20,
        background: '#13131f',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px',
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: 18, padding: '4px 8px', borderRadius: 6, lineHeight: 1 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'}
        >←</button>

        <div style={{ width: 28, height: 28, borderRadius: 7, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: -0.3 }}>WAC</span>
        </div>

        <span style={{ flex: 1, color: '#fff', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: 0.1 }}>
          {presentation.title}
        </span>

        {saveStatus !== 'idle' && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
            background: saveStatus === 'saving' ? 'rgba(251,191,36,0.12)' : 'rgba(74,222,128,0.12)',
            color:      saveStatus === 'saving' ? '#fbbf24' : '#4ade80',
          }}>
            {saveStatus === 'saving' ? 'Saving…' : '✓ Saved'}
          </span>
        )}

        <TBtn label="Theme" active={themeOpen} onClick={() => setThemeOpen((o) => !o)} accent="#7c3aed" />
        <TBtn
          label={editMode ? 'Done' : 'Edit'}
          active={editMode}
          onClick={() => { setEditMode((m) => !m); setSelectedBlockId(null); setEditingBlockId(null) }}
          accent="#6366f1"
        />

        {/* Download button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setDownloadOpen((o) => !o); setExportReady(null); setExportError(null) }}
            disabled={exporting}
            style={{
              background: exporting ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.5)',
              color: exporting ? 'rgba(165,180,252,0.5)' : '#a5b4fc',
              borderRadius: 7, padding: '5px 14px',
              fontSize: 13, fontWeight: 600, cursor: exporting ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {exporting ? (
              <>
                <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(165,180,252,0.3)', borderTopColor: '#a5b4fc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Exporting {exportProgress}%
              </>
            ) : '↓ Download'}
          </button>

          {/* Format picker dropdown */}
          {downloadOpen && !exporting && (
            <div
              style={{
                position: 'absolute', top: 44, right: 0, zIndex: 100,
                background: '#1e1e35', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                minWidth: 180,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '10px 14px 6px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Choose format
              </div>
              {(['pptx', 'html'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleDownload(fmt)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none',
                    border: 'none', padding: '10px 14px',
                    color: '#e2e8f0', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    borderTop: fmt === 'html' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <span style={{ fontSize: 18 }}>{fmt === 'pptx' ? '📊' : '🌐'}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{fmt.toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                      {fmt === 'pptx' ? 'PowerPoint file' : 'Web HTML file'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export ready / error banner */}
      {(exportReady || exportError) && (
        <div style={{
          background: exportReady ? '#0f2d1f' : '#2d0f0f',
          color: exportReady ? '#4ade80' : '#f87171',
          padding: '8px 20px', fontSize: 12, textAlign: 'center', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          {exportReady ? (
            <>
              <span>✓ Your file is ready — you can download now</span>
              <a
                href={exportApi.downloadUrl(exportReady.jobId)}
                style={{ color: '#86efac', fontWeight: 700, textDecoration: 'underline' }}
              >
                Download
              </a>
              <button onClick={() => setExportReady(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
            </>
          ) : (
            <>
              <span>{exportError}</span>
              <button onClick={() => setExportError(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
            </>
          )}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left slide strip */}
        <div style={{
          width: 168, flexShrink: 0,
          background: '#0f0f1a',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Add slide button */}
          <button
            onClick={addSlide}
            style={{
              margin: '10px 8px 4px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px dashed rgba(99,102,241,0.4)',
              borderRadius: 7, color: '#818cf8',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.18)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)' }}
          >
            + Add Slide
          </button>

          {/* Slide thumbnails */}
          <div style={{ padding: '4px 8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slides.map((s, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <button
                  onClick={() => { setActiveSlide(i); setSelectedBlockId(null); setEditingBlockId(null) }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCtxMenu({ index: i, x: e.clientX, y: e.clientY })
                  }}
                  style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <div style={{
                    border: `2px solid ${i === activeSlide ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 7, overflow: 'hidden', transition: 'border-color 0.15s',
                    lineHeight: 0,
                  }}>
                    <SlidePreview slide={s} theme={themeObj} scale={0.116} />
                  </div>
                  <div style={{ color: i === activeSlide ? '#a5b4fc' : 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 4, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
                    {s.order}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Center canvas */}
        <div
          ref={centerRef}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative', background: canvasBg,
            transition: 'background 0.4s ease',
          }}
          onClick={() => {
            if (editMode) { setSelectedBlockId(null); setEditingBlockId(null) }
            setDownloadOpen(false)
          }}
        >
          {currentSlide && (
            <SlidePreview
              slide={currentSlide}
              theme={themeObj}
              scale={canvasScale}
              selectedBlockId={editMode ? selectedBlockId : null}
              editingBlockId={editMode ? editingBlockId : null}
              onBlockClick={editMode ? handleBlockClick : undefined}
              onBlockDoubleClick={editMode ? handleBlockDoubleClick : undefined}
              onBlockContentChange={editMode ? handleBlockContentChange : undefined}
            />
          )}

          <div style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif',
            pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            {currentSlide?.order} / {slides.length}
            {editMode && '  ·  Click to select  ·  Double-click to edit text'}
          </div>
        </div>

        {/* Right property panel */}
        {editMode && selectedBlock && (
          <div style={{
            width: 232, flexShrink: 0,
            background: '#13131f',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            overflowY: 'auto', padding: 16,
          }}>
            <PropertyPanel
              block={selectedBlock}
              onStylingChange={(u) => updateStyling(selectedBlock.id, u)}
              onContentChange={(c) => updateContent(selectedBlock.id, c)}
              onImageUpload={(url) => updateContent(selectedBlock.id, url)}
              dark
            />
          </div>
        )}
      </div>

      {/* ── Context menu ── */}
      {ctxMenu && (
        <div
          style={{
            position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 200,
            background: '#1e1e35', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            minWidth: 160,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CtxItem label="Duplicate" icon="⧉" onClick={() => duplicateSlide(ctxMenu.index)} />
          <CtxItem
            label="Move Up"
            icon="↑"
            disabled={ctxMenu.index === 0}
            onClick={() => moveSlide(ctxMenu.index, -1)}
          />
          <CtxItem
            label="Move Down"
            icon="↓"
            disabled={ctxMenu.index === slides.length - 1}
            onClick={() => moveSlide(ctxMenu.index, 1)}
          />
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
          <CtxItem
            label="Delete"
            icon="🗑"
            danger
            disabled={slides.length <= 1}
            onClick={() => deleteSlide(ctxMenu.index)}
          />
        </div>
      )}

      {/* Theme panel overlay */}
      {themeOpen && (
        <ThemePanel
          currentThemeId={activeTheme.id}
          onClose={() => setThemeOpen(false)}
          onApply={handleApplyTheme}
        />
      )}

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Toolbar button ─────────────────────────────────────────────────────────────

function TBtn({ label, active, onClick, accent }: { label: string; active: boolean; onClick: () => void; accent: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `${accent}28` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${active ? accent : 'rgba(255,255,255,0.1)'}`,
        color: active ? '#fff' : 'rgba(255,255,255,0.7)',
        borderRadius: 7, padding: '5px 14px',
        fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >{label}</button>
  )
}

// ── Context menu item ─────────────────────────────────────────────────────────

function CtxItem({ label, icon, onClick, disabled, danger }: {
  label: string; icon: string; onClick: () => void; disabled?: boolean; danger?: boolean
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        width: '100%', textAlign: 'left', background: 'none', border: 'none',
        padding: '9px 14px', color: disabled ? 'rgba(255,255,255,0.2)' : danger ? '#f87171' : '#e2e8f0',
        fontSize: 13, fontWeight: 500, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      <span style={{ width: 16, textAlign: 'center', fontSize: 14 }}>{icon}</span>
      {label}
    </button>
  )
}
