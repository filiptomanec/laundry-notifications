interface WashingMachineIconProps {
  className?: string
}

export function WashingMachineIcon({ className }: WashingMachineIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Machine body */}
      <rect x="3" y="2" width="18" height="20" rx="2" />
      {/* Control panel */}
      <line x1="3" y1="7" x2="21" y2="7" />
      {/* Buttons */}
      <circle cx="7" cy="4.5" r="1" fill="currentColor" />
      <circle cx="11" cy="4.5" r="1" fill="currentColor" />
      {/* Door / drum */}
      <circle cx="12" cy="14" r="5" />
      {/* Inner drum detail */}
      <circle cx="12" cy="14" r="3" />
      {/* Water waves inside */}
      <path d="M10 14.5c0.5-0.5 1-0.5 1.5 0s1 0.5 1.5 0" />
    </svg>
  )
}
