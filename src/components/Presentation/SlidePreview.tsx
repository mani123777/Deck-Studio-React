import type { Slide, Theme } from '../../types'

interface Props {
  slide: Slide
  theme?: Theme
  scale?: number
  selectedBlockId?: string | null
  editingBlockId?: string | null
  onBlockClick?: (blockId: string) => void
  onBlockDoubleClick?: (blockId: string) => void
  onBlockContentChange?: (blockId: string, newContent: string) => void
}

const W = 1280
const H = 720

function getBackground(slide: Slide, theme?: Theme): string {
  const bg = slide.background
  if (bg) {
    if (bg.type === 'gradient') return bg.value
    if (bg.type === 'image')    return `url(${bg.value}) center/cover no-repeat`
    if (bg.type === 'color')    return bg.value
  }
  return theme?.colors.background ?? '#F8FAFC'
}

function renderBlock(
  block: Slide['blocks'][number],
  scale: number,
  theme: Theme | undefined,
  isSelected: boolean,
  isEditing: boolean,
  onBlockClick?: (id: string) => void,
  onBlockDoubleClick?: (id: string) => void,
  onBlockContentChange?: (id: string, content: string) => void,
) {
  const s   = block.styling
  const pos = block.position

  const baseStyle: React.CSSProperties = {
    position:   'absolute',
    left:       pos.x * scale,
    top:        pos.y * scale,
    width:      pos.w * scale,
    height:     pos.h * scale,
    overflow:   'hidden',
    boxSizing:  'border-box',
    cursor:     onBlockClick ? 'pointer' : 'default',
    outline:    isSelected ? `${2 * scale}px solid #6366f1` : 'none',
    outlineOffset: 2 * scale,
  }

  const handlers = {
    onClick:      (e: React.MouseEvent) => { e.stopPropagation(); onBlockClick?.(block.id) },
    onDoubleClick:(e: React.MouseEvent) => { e.stopPropagation(); onBlockDoubleClick?.(block.id) },
  }

  // ── Inline editing overlay ─────────────────────────────────────────────
  if (isEditing && block.type !== 'image' && block.type !== 'shape' && block.type !== 'panel') {
    return (
      <textarea
        key={block.id}
        autoFocus
        defaultValue={block.content}
        onChange={(e) => onBlockContentChange?.(block.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...baseStyle,
          background:  'rgba(255,255,255,0.12)',
          border:      `${2 * scale}px solid #6366f1`,
          color:       s.color || '#ffffff',
          fontFamily:  s.font_family || 'Inter, sans-serif',
          fontSize:    (s.font_size ?? 16) * scale,
          fontWeight:  s.font_weight ?? 400,
          resize:      'none',
          padding:     `${4 * scale}px`,
          lineHeight:  1.4,
          outline:     'none',
          borderRadius: 4 * scale,
        }}
      />
    )
  }

  // ── Panel block (Gamma-style gradient decorative panel) ───────────────
  if (block.type === 'panel') {
    const grad = s.background_color || `linear-gradient(160deg, #0F172A 0%, #1E293B 100%)`
    return (
      <div
        key={block.id}
        style={{
          ...baseStyle,
          background:   grad,
          borderRadius: 0,
          overflow:     'hidden',
        }}
        {...handlers}
      />
    )
  }

  // ── Shape (divider / accent bar) ──────────────────────────────────────
  if (block.type === 'shape') {
    const bg = s.background_color || s.color || theme?.colors.accent || '#6366f1'
    return (
      <div
        key={block.id}
        style={{
          ...baseStyle,
          background:   bg,
          borderRadius: Math.min(pos.h, pos.w) * scale * 0.5,
        }}
        {...handlers}
      />
    )
  }

  // ── Image block ───────────────────────────────────────────────────────
  if (block.type === 'image') {
    if (!block.content) return null
    return (
      <img
        key={block.id}
        src={block.content}
        alt=""
        style={{
          ...baseStyle,
          objectFit:    'cover',
          borderRadius: pos.x === 0 ? 0 : 12 * scale,
        }}
        {...handlers}
      />
    )
  }

  // ── Badge (pill label: "OVERVIEW", "METRICS", …) ──────────────────────
  if (block.type === 'badge') {
    const borderColor = s.color || theme?.colors.accent || '#6366f1'
    return (
      <div
        key={block.id}
        style={{
          ...baseStyle,
          display:        'inline-flex',
          alignItems:     'center',
          border:         `${1.5 * scale}px solid ${borderColor}`,
          borderRadius:   100 * scale,
          padding:        `0 ${10 * scale}px`,
          background:     `${borderColor}12`,
          overflow:       'visible',
        }}
        {...handlers}
      >
        <span style={{
          fontFamily:    s.font_family || 'Inter, sans-serif',
          fontSize:      (s.font_size ?? 11) * scale,
          fontWeight:    s.font_weight ?? 700,
          color:         borderColor,
          letterSpacing: 0.1 * (s.font_size ?? 11) * scale,
          textTransform: 'uppercase' as const,
          whiteSpace:    'nowrap',
        }}>
          {block.content}
        </span>
      </div>
    )
  }

  // ── Card block (Gamma-style: title + body, alternating dark/light) ────
  if (block.type === 'card') {
    const bgColor = s.background_color || theme?.colors.primary || '#0F172A'
    const lines   = block.content.split('\n').filter(Boolean)
    const title   = lines[0] || ''
    const body    = lines.slice(1).join(' ')

    // Determine if this is a dark or light card for shadow intensity
    const isDarkCard = bgColor.startsWith('#') &&
      parseInt(bgColor.slice(1), 16) < 0x888888 * 3

    return (
      <div
        key={block.id}
        style={{
          ...baseStyle,
          background:    bgColor,
          borderRadius:  16 * scale,
          padding:       `${18 * scale}px ${20 * scale}px`,
          display:       'flex',
          flexDirection: 'column',
          justifyContent:'flex-start',
          gap:           6 * scale,
          boxSizing:     'border-box',
          boxShadow:     isDarkCard
            ? `0 ${8 * scale}px ${24 * scale}px rgba(0,0,0,0.25)`
            : `0 ${4 * scale}px ${16 * scale}px rgba(0,0,0,0.08), inset 0 0 0 ${scale}px rgba(0,0,0,0.06)`,
        }}
        {...handlers}
      >
        <span style={{
          fontFamily:  s.font_family || 'Inter, sans-serif',
          fontSize:    (s.font_size ?? 18) * scale,
          fontWeight:  s.font_weight ?? 700,
          color:       s.color || '#ffffff',
          lineHeight:  1.3,
        }}>
          {title}
        </span>
        {body && (
          <span style={{
            fontFamily: s.font_family || 'Inter, sans-serif',
            fontSize:   (s.font_size ?? 18) * 0.75 * scale,
            fontWeight: 400,
            color:      s.color
              ? `${s.color}b0`
              : 'rgba(255,255,255,0.72)',
            lineHeight: 1.5,
          }}>
            {body}
          </span>
        )}
      </div>
    )
  }

  // ── Process circle ────────────────────────────────────────────────────
  if (block.type === 'process_circle') {
    const bgColor = s.background_color || theme?.colors.accent || '#6366f1'
    const lines   = block.content.split('\n').filter(Boolean)
    return (
      <div
        key={block.id}
        style={{
          ...baseStyle,
          background:     bgColor,
          borderRadius:   '50%',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        `${12 * scale}px`,
          gap:            3 * scale,
          textAlign:      'center',
          boxShadow:      `0 ${6 * scale}px ${20 * scale}px ${bgColor}60`,
        }}
        {...handlers}
      >
        {lines.map((line, i) => (
          <span key={i} style={{
            fontFamily: s.font_family || 'Inter, sans-serif',
            fontSize:   (i === 0 ? s.font_size ?? 16 : (s.font_size ?? 16) * 0.75) * scale,
            fontWeight: i === 0 ? (s.font_weight ?? 700) : 400,
            color:      s.color || '#ffffff',
            lineHeight: 1.2,
          }}>
            {line}
          </span>
        ))}
      </div>
    )
  }

  // ── Stat block ────────────────────────────────────────────────────────
  if (block.type === 'stat') {
    const [value, ...labelParts] = block.content.split('\n')
    const label = labelParts.join(' ')
    return (
      <div
        key={block.id}
        style={{
          ...baseStyle,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          background:     s.background_color || 'rgba(255,255,255,0.08)',
          borderRadius:   16 * scale,
          border:         `${scale}px solid rgba(255,255,255,0.12)`,
          padding:        `${16 * scale}px`,
          gap:            6 * scale,
          boxShadow:      `0 ${4 * scale}px ${24 * scale}px rgba(0,0,0,0.15)`,
        }}
        {...handlers}
      >
        <span style={{
          fontFamily: s.font_family || 'Inter, sans-serif',
          fontSize:   (s.font_size ?? 60) * scale,
          fontWeight: s.font_weight ?? 800,
          color:      s.color || theme?.colors.accent || '#6366f1',
          lineHeight: 1,
        }}>
          {value}
        </span>
        {label && (
          <span style={{
            fontFamily: s.font_family || 'Inter, sans-serif',
            fontSize:   16 * scale,
            fontWeight: 500,
            color:      'rgba(255,255,255,0.65)',
            textAlign:  'center',
            lineHeight: 1.3,
          }}>
            {label}
          </span>
        )}
      </div>
    )
  }

  // ── Quote block ───────────────────────────────────────────────────────
  if (block.type === 'quote') {
    return (
      <div
        key={block.id}
        style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${20 * scale}px` }}
        {...handlers}
      >
        <p style={{
          fontFamily: s.font_family || 'Georgia, serif',
          fontSize:   (s.font_size ?? 30) * scale,
          fontWeight: s.font_weight ?? 400,
          color:      s.color || '#ffffff',
          textAlign:  'center',
          lineHeight: 1.65,
          fontStyle:  'italic',
          margin:     0,
        }}>
          {block.content}
        </p>
      </div>
    )
  }

  // ── Bullet list ───────────────────────────────────────────────────────
  if (block.type === 'bullet') {
    const lines = block.content.split('\n').filter(Boolean)
    return (
      <div
        key={block.id}
        style={{ ...baseStyle, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 10 * scale, padding: `${6 * scale}px 0` }}
        {...handlers}
      >
        {lines.map((line, idx) => {
          const clean = line.replace(/^[•\-\*]\s*/, '')
          // Detect bold prefix: **text**: rest
          const boldMatch = clean.match(/^\*\*(.+?)\*\*:\s*(.*)$/)
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 * scale }}>
              <span style={{
                minWidth:    8 * scale,
                width:       8 * scale,
                height:      8 * scale,
                borderRadius:'50%',
                background:  theme?.colors.accent || theme?.colors.primary || '#6366f1',
                marginTop:   (s.font_size ?? 22) * scale * 0.38,
                flexShrink:  0,
              }} />
              <span style={{
                fontFamily: s.font_family || 'Inter, sans-serif',
                fontSize:   (s.font_size ?? 22) * scale,
                fontWeight: s.font_weight ?? 400,
                color:      s.color || theme?.colors.text || '#0F172A',
                lineHeight: 1.55,
              }}>
                {boldMatch ? (
                  <>
                    <strong style={{ fontWeight: 700 }}>{boldMatch[1]}:</strong>{' '}{boldMatch[2]}
                  </>
                ) : clean}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Title / Heading ───────────────────────────────────────────────────
  if (block.type === 'title' || block.type === 'heading') {
    return (
      <div
        key={block.id}
        style={{ ...baseStyle, display: 'flex', alignItems: 'center' }}
        {...handlers}
      >
        <span style={{
          fontFamily:  s.font_family || 'Inter, sans-serif',
          fontSize:    (s.font_size ?? 52) * scale,
          fontWeight:  s.font_weight ?? 800,
          color:       s.color || theme?.colors.primary || '#0F172A',
          lineHeight:  1.15,
          textAlign:   (s.text_align as React.CSSProperties['textAlign']) ?? 'left',
          width:       '100%',
          letterSpacing: -0.5 * scale,
        }}>
          {block.content}
        </span>
      </div>
    )
  }

  // ── Subtitle / Caption / Generic text ─────────────────────────────────
  return (
    <div
      key={block.id}
      style={{ ...baseStyle, display: 'flex', alignItems: 'center', padding: `0 ${block.type === 'caption' ? 8 * scale : 0}px` }}
      {...handlers}
    >
      <span style={{
        fontFamily: s.font_family || 'Inter, sans-serif',
        fontSize:   (s.font_size ?? 16) * scale,
        fontWeight: s.font_weight ?? 400,
        color:      s.color || theme?.colors.text || '#64748B',
        lineHeight: 1.55,
        textAlign:  (s.text_align as React.CSSProperties['textAlign']) ?? 'left',
        width:      '100%',
      }}>
        {block.content}
      </span>
    </div>
  )
}

export function SlidePreview({
  slide,
  theme,
  scale = 0.3,
  selectedBlockId,
  editingBlockId,
  onBlockClick,
  onBlockDoubleClick,
  onBlockContentChange,
}: Props) {
  const background = getBackground(slide, theme)

  return (
    <div
      style={{
        width:     W * scale,
        height:    H * scale,
        background,
        position:  'relative',
        overflow:  'hidden',
        borderRadius: 6 * scale,
        boxShadow: `0 ${4 * scale}px ${20 * scale}px rgba(0,0,0,0.18)`,
        flexShrink: 0,
      }}
      onClick={() => onBlockClick?.('')}
    >
      <div style={{
        position:   'absolute',
        bottom:     10 * scale,
        right:      16 * scale,
        fontSize:   11 * scale,
        color:      'rgba(255,255,255,0.28)',
        fontFamily: 'Inter, sans-serif',
        zIndex:     10,
        fontWeight: 600,
      }}>
        {slide.order}
      </div>
      {slide.blocks.map((block) =>
        renderBlock(
          block, scale, theme,
          selectedBlockId === block.id,
          editingBlockId  === block.id,
          onBlockClick, onBlockDoubleClick, onBlockContentChange,
        )
      )}
    </div>
  )
}
