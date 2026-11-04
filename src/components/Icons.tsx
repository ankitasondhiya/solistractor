import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

/**
 * The Solis wordmark, redrawn from the site's own logo file so it can take
 * any colour through `currentColor` — navy on the light header, white on the
 * footer — instead of shipping one image per colour.
 */
export function SolisLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 354 72.9" fill="currentColor" role="img" aria-label="Solis" {...props}>
      <path d="m100.7.8H23.8c-.9,0-1.8.1-2.7.4-2.4.4-4.6,1.9-5.7,4.1-2.4,4.5-1.1,15.2,3.3,18l44.6,28.6H9.4C4,52.2-.2,56.6,0,61.9c.1,5.1,4.3,9.2,9.4,9.4l78.5-.2c9.3,0,16.4-19.5,6.5-25.3l-43.8-25.7h50.1c5.2-.2,9.3-4.5,9.1-9.6.1-5.2-4-9.5-9.1-9.6" />
      <path d="m215.7,0l-15.5,72.9h18.3L234,0h-18.3Z" />
      <path d="m147.3,10.4c-25.2,6.8-42.9,25.6-39.7,41.9,3.2,16.3,26.3,24,51.5,17.2,25.2-6.8,42.9-25.6,39.7-41.9s-26.3-24-51.5-17.2m9.9,42.2c-14.6,5.1-29.1,4.1-32.4-2.2s5.8-15.5,20.4-20.5,29.1-4.1,32.4,2.2-5.8,15.5-20.4,20.6" />
      <path d="m248.9,1.2h18.3l-5.3,19.7h-18.3l5.3-19.7Zm91.8,49.6c2.1,1.4,3.4,3.7,3.7,6.2.3.9.5,1.9.5,2.9,0,4.6-5.4,13-9.9,13h-103.7l11.9-47.8h18.3l-7.8,31.3c.5-.1,1.1-.2,1.6-.2h58.3l-38.7-24.8c-3.8-2.5-5-11.8-2.8-15.7,1-1.9,2.8-3.2,5-3.6.8-.2,1.5-.4,2.3-.4h66.7c4.5.1,8,3.9,7.9,8.4.1,4.5-3.4,8.2-7.9,8.4h-43.4l38,22.3Z" />
    </svg>
  )
}

function Line({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const ArrowRight = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Line>
)

export const ArrowLeft = (p: IconProps) => (
  <Line {...p}>
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </Line>
)

export const ArrowDown = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 4v15M6 13l6 6 6-6" />
  </Line>
)

export const ArrowUpRight = (p: IconProps) => (
  <Line {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Line>
)

export const Phone = (p: IconProps) => (
  <Line {...p}>
    <path d="M5 4h3.5l1.8 4.6-2.3 1.4a11 11 0 0 0 6 6l1.4-2.3L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
  </Line>
)

export const Mail = (p: IconProps) => (
  <Line {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </Line>
)

export const Pin = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Line>
)

export const Check = (p: IconProps) => (
  <Line {...p}>
    <path d="m5 12.5 4.2 4.2L19 7" />
  </Line>
)

export const Shield = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Line>
)

export const Menu = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </Line>
)

export const Close = (p: IconProps) => (
  <Line {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Line>
)

export const Plus = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 5v14M5 12h14" />
  </Line>
)

/* Why-Solis pillars ------------------------------------------------------- */
export const Partnership = (p: IconProps) => (
  <Line {...p}>
    <circle cx="9" cy="12" r="5.5" />
    <circle cx="15" cy="12" r="5.5" />
  </Line>
)

export const Wheel = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
  </Line>
)

export const Seat = (p: IconProps) => (
  <Line {...p}>
    <path d="M8 3h5a2 2 0 0 1 2 2.3l-1.2 8.2H7.5L6.1 5.4A2 2 0 0 1 8 3Z" />
    <path d="M5 13.5h12.5a1.5 1.5 0 0 1 1.5 1.5v1H6.5A1.5 1.5 0 0 1 5 14.5v-1Z" />
    <path d="M11 16v5M7.5 21h7" />
  </Line>
)

export const Wrench = (p: IconProps) => (
  <Line {...p}>
    <path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-1.5 1.5-2-2a4 4 0 0 1-5-5L9 11 4.5 15.5a2.1 2.1 0 0 0 3 3L12 14" />
    <path d="M14.5 6.5 17 4l3 3-2.5 2.5" />
  </Line>
)

/* Model finder uses ------------------------------------------------------- */
export const Yard = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 11 9 6l6 5v8H3v-8Z" />
    <path d="M7 19v-4h4v4" />
    <path d="M15 14h6M15 18h6M17 12v8M20 12v8" />
  </Line>
)

export const Tree = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 21v-6" />
    <path d="M12 15a5 5 0 0 0 5-5 5 5 0 0 0-2.2-4.1A3 3 0 0 0 9.2 5.9 5 5 0 0 0 7 10a5 5 0 0 0 5 5Z" />
    <path d="M8 21h8" />
  </Line>
)

export const Horseshoe = (p: IconProps) => (
  <Line {...p}>
    <path d="M6.5 20 5 13a7 7 0 1 1 14 0l-1.5 7" />
    <path d="M9.3 18.5 8.5 13a3.5 3.5 0 1 1 7 0l-.8 5.5" />
    <path d="M5 20h3.5M15.5 20H19" />
  </Line>
)

export const Apple = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 7.5c-1.4-1-3.6-1.3-5.2 0-2.5 2-1.8 7 .6 10.4 1.3 1.8 2.6 2.4 4.6 1.4 2 1 3.3.4 4.6-1.4 2.4-3.4 3.1-8.4.6-10.4-1.6-1.3-3.8-1-5.2 0Z" />
    <path d="M12 7.5c0-2 .8-3.5 2.5-4.5" />
  </Line>
)

export const Wheat = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 22V8" />
    <path d="M12 8c-1.8-.6-2.8-2.3-2.5-4.5 1.8.6 2.8 2.3 2.5 4.5ZM12 8c1.8-.6 2.8-2.3 2.5-4.5-1.8.6-2.8 2.3-2.5 4.5Z" />
    <path d="M12 13c-2.2-.3-3.6-1.9-3.8-4.2 2.2.3 3.6 1.9 3.8 4.2ZM12 13c2.2-.3 3.6-1.9 3.8-4.2-2.2.3-3.6 1.9-3.8 4.2Z" />
    <path d="M12 18c-2.2-.3-3.6-1.9-3.8-4.2 2.2.3 3.6 1.9 3.8 4.2ZM12 18c2.2-.3 3.6-1.9 3.8-4.2-2.2.3-3.6 1.9-3.8 4.2Z" />
  </Line>
)

export const Loader = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 18h7l3-6h-4L3 18Z" />
    <path d="M13 12 17 5l4 3" />
    <path d="M10 18h4" />
    <circle cx="17" cy="18" r="2.5" />
  </Line>
)
