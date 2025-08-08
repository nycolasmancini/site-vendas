interface IconProps {
  className?: string
  size?: number
}

export const CaseIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <rect x="6" y="2" width="12" height="20" rx="2" ry="2"/>
    <circle cx="16" cy="6" r="1.2"/>
  </svg>
)

export const ScreenProtectorIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <rect x="6" y="3" width="10" height="18" rx="1.5" ry="1.5"/>
    <line x1="8" y1="6" x2="14" y2="12"/>
  </svg>
)

export const WiredHeadphonesIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <path d="M7 4v6a1 1 0 0 0 1 1h1v3"/>
    <path d="M17 4v6a1 1 0 0 1-1 1h-1v3"/>
  </svg>
)

export const BluetoothHeadphonesIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <path d="M8 5a2 2 0 0 1 4 0v6a2 2 0 1 1-4 0V5Z"/>
    <path d="M12 8h3v4"/>
  </svg>
)

export const SpeakerIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <rect x="5" y="8" width="14" height="10" rx="2"/>
    <circle cx="12" cy="13" r="2"/>
  </svg>
)

export const SmartwatchIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <rect x="7" y="6" width="10" height="12" rx="2"/>
    <path d="M12 10v2l1 1"/>
  </svg>
)

export const CableIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <path d="M6 12v4a2 2 0 0 0 2 2h2"/>
    <rect x="10" y="17" width="4" height="2" rx="0.5"/>
  </svg>
)

export const ChargerIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <rect x="8" y="4" width="8" height="14" rx="2"/>
    <path d="M12 7v4l2-2"/>
  </svg>
)

export const CarChargerIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <path d="M10 4h4v4l2 2v6l-2 2v2h-4v-2l-2-2V10l2-2V4Z"/>
  </svg>
)

// Ícones adicionais úteis para o e-commerce
export const PhoneIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
)

export const ShoppingCartIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
  </svg>
)

export const StoreIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <path d="M3 21h18"/>
    <path d="M5 21V7l8-4v18"/>
    <path d="M19 21V7l-8-4v18"/>
    <path d="M9 9v12"/>
    <path d="M15 9v12"/>
  </svg>
)

export const BoxIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)

// Ícone para Suportes Veiculares
export const CarHolderIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <path d="M4 16c0 .796.316 1.559.879 2.121C5.441 18.684 6.204 19 7 19h10c.796 0 1.559-.316 2.121-.879C19.684 17.559 20 16.796 20 16"/>
    <path d="M4 12h16"/>
    <path d="M8 8h8"/>
    <rect x="6" y="6" width="12" height="8" rx="2"/>
  </svg>
)

// Ícone para Adaptadores
export const AdapterIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <rect x="4" y="4" width="6" height="6" rx="1"/>
    <rect x="14" y="14" width="6" height="6" rx="1"/>
    <path d="M10 7h4l2 2v4"/>
    <path d="M14 17h-4l-2-2v-4"/>
  </svg>
)