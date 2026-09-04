import type { ReactNode } from 'react'

const wood = '#c4a06a'
const woodDark = '#8a6238'
const cream = '#f4ead6'
const metal = '#9aa1a8'
const metalDark = '#6d737a'
const honey = '#d4b45a'
const ink = '#3a2f22'

function Svg({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <svg
      className="kit-svg"
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {children}
    </svg>
  )
}

function Box({
  y,
  height,
  fill = wood,
  stroke = woodDark,
}: {
  y: number
  height: number
  fill?: string
  stroke?: string
}) {
  return (
    <rect
      x="8"
      y={y}
      width="32"
      height={height}
      rx="2"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.6"
    />
  )
}

export function KitIllustration({ typeId }: { typeId: string }) {
  if (typeId === 'deep-box') {
    return (
      <Svg title="Deep box">
        <Box y={8} height={32} />
        <line x1="8" y1="18" x2="40" y2="18" stroke={woodDark} strokeWidth="1.2" />
        <line x1="8" y1="28" x2="40" y2="28" stroke={woodDark} strokeWidth="1.2" />
      </Svg>
    )
  }
  if (typeId === 'shallow-box') {
    return (
      <Svg title="Shallow box">
        <Box y={16} height={18} />
        <line x1="8" y1="25" x2="40" y2="25" stroke={woodDark} strokeWidth="1.2" />
      </Svg>
    )
  }
  if (typeId === 'nuc-box-4' || typeId === 'nuc-box-5') {
    const n = typeId === 'nuc-box-5' ? 5 : 4
    const gap = 22 / (n + 1)
    return (
      <Svg title={typeId === 'nuc-box-5' ? '5-frame nuc box' : '4-frame nuc box'}>
        <rect
          x="14"
          y="10"
          width="20"
          height="28"
          rx="2"
          fill={wood}
          stroke={woodDark}
          strokeWidth="1.6"
        />
        {Array.from({ length: n }, (_, i) => (
          <line
            key={i}
            x1={16 + gap * (i + 1)}
            y1="14"
            x2={16 + gap * (i + 1)}
            y2="34"
            stroke={cream}
            strokeWidth="1.4"
          />
        ))}
      </Svg>
    )
  }
  if (
    typeId === 'deep-used-frame' ||
    typeId === 'waxed-spring-frame' ||
    typeId === 'unbuilt-spring-frame' ||
    typeId === 'shallow-frame'
  ) {
    const y = typeId === 'shallow-frame' ? 14 : 8
    const h = typeId === 'shallow-frame' ? 22 : 32
    const filled = typeId !== 'unbuilt-spring-frame'
    const bar = typeId === 'deep-used-frame' ? woodDark : honey
    return (
      <Svg title="Frame">
        <rect
          x="12"
          y={y}
          width="24"
          height={h}
          fill={cream}
          stroke={woodDark}
          strokeWidth="2"
        />
        {filled
          ? [0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1={16 + i * 5}
                y1={y + 3}
                x2={16 + i * 5}
                y2={y + h - 3}
                stroke={bar}
                strokeWidth="1.6"
              />
            ))
          : null}
      </Svg>
    )
  }
  if (typeId === 'bottom-board') {
    return (
      <Svg title="Bottom board">
        <rect
          x="6"
          y="20"
          width="36"
          height="10"
          rx="1.5"
          fill={wood}
          stroke={woodDark}
          strokeWidth="1.6"
        />
        <rect x="10" y="22" width="28" height="3" fill={cream} opacity="0.7" />
      </Svg>
    )
  }
  if (typeId === 'inner-cover') {
    return (
      <Svg title="Inner cover">
        <rect
          x="8"
          y="16"
          width="32"
          height="14"
          rx="1.5"
          fill={wood}
          stroke={woodDark}
          strokeWidth="1.6"
        />
        <circle cx="24" cy="23" r="3.2" fill={cream} stroke={woodDark} strokeWidth="1.2" />
      </Svg>
    )
  }
  if (typeId === 'metal-lid') {
    return (
      <Svg title="Metal lid">
        <path
          d="M8 22 L24 12 L40 22 V30 H8 Z"
          fill={metal}
          stroke={metalDark}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <line x1="8" y1="22" x2="40" y2="22" stroke={metalDark} strokeWidth="1.2" />
      </Svg>
    )
  }
  if (typeId === 'wooden-lid') {
    return (
      <Svg title="Wooden lid">
        <path
          d="M8 20 L24 12 L40 20 V30 H8 Z"
          fill={wood}
          stroke={woodDark}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <line x1="8" y1="20" x2="40" y2="20" stroke={woodDark} strokeWidth="1.2" />
      </Svg>
    )
  }
  if (typeId === 'queen-excluder') {
    return (
      <Svg title="Queen excluder">
        <rect
          x="8"
          y="14"
          width="32"
          height="20"
          rx="1.5"
          fill={wood}
          stroke={woodDark}
          strokeWidth="1.6"
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={12 + i * 6}
            y1="17"
            x2={12 + i * 6}
            y2="31"
            stroke={cream}
            strokeWidth="2"
          />
        ))}
      </Svg>
    )
  }
  if (typeId === 'round-feeder') {
    return (
      <Svg title="Round feeder">
        <circle cx="24" cy="24" r="13" fill={cream} stroke={woodDark} strokeWidth="1.8" />
        <circle cx="24" cy="24" r="6" fill="none" stroke={honey} strokeWidth="2" />
      </Svg>
    )
  }
  if (typeId === 'feeding-jar') {
    return (
      <Svg title="Feeding jar">
        <rect x="18" y="8" width="12" height="6" rx="1" fill={wood} stroke={woodDark} strokeWidth="1.2" />
        <path
          d="M16 14 H32 L30 38 H18 Z"
          fill="#e8f0f4"
          stroke={ink}
          strokeWidth="1.5"
        />
        <line x1="19" y1="22" x2="29" y2="22" stroke={honey} strokeWidth="3" opacity="0.8" />
      </Svg>
    )
  }
  return (
    <Svg title="Kit">
      <rect
        x="12"
        y="12"
        width="24"
        height="24"
        rx="4"
        fill={cream}
        stroke={woodDark}
        strokeWidth="1.6"
      />
    </Svg>
  )
}

export function KitThumb({
  typeId,
  photo,
}: {
  typeId: string
  photo?: string
}) {
  return (
    <span className="kit-thumb" aria-hidden={photo ? true : undefined}>
      {photo ? (
        <img src={photo} alt="" />
      ) : (
        <KitIllustration typeId={typeId} />
      )}
    </span>
  )
}
