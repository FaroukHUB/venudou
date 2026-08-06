/**
 * Icônes de marques aux couleurs officielles, dessinées en SVG interne
 * (aucune ressource externe). Utilisées sur le kiosque, la prévisualisation
 * et le site public. Résolues automatiquement d'après la valeur stable de
 * l'option (facebook, instagram, tiktok, snapchat, google, …).
 */

export interface BrandIconProps {
  className?: string;
}

function Facebook({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M15.6 12.7h-2.4V20h-2.9v-7.3H8.5V10h1.8V8.6c0-2 1-3.4 3.3-3.4h2v2.6h-1.4c-.8 0-1 .4-1 1.1V10h2.7l-.3 2.7z"
      />
    </svg>
  );
}

function Instagram({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="vd-ig" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FEDA75" />
          <stop offset="30%" stopColor="#F58529" />
          <stop offset="60%" stopColor="#DD2A7B" />
          <stop offset="100%" stopColor="#8134AF" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#vd-ig)" />
      <rect
        x="5.2"
        y="5.2"
        width="13.6"
        height="13.6"
        rx="4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16.4" cy="7.6" r="1.1" fill="#fff" />
    </svg>
  );
}

function TikTok({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="6" fill="#010101" />
      <path
        fill="#25F4EE"
        d="M15.2 5h-2.6v9.9a2.2 2.2 0 1 1-2.2-2.2c.2 0 .5 0 .7.1V10a5 5 0 0 0-.7 0 4.9 4.9 0 1 0 4.9 4.9V9.6a6 6 0 0 0 3.3 1V8a3.6 3.6 0 0 1-3.4-3z"
        transform="translate(-0.5 0.4)"
      />
      <path
        fill="#FE2C55"
        d="M15.2 5h-2.6v9.9a2.2 2.2 0 1 1-2.2-2.2c.2 0 .5 0 .7.1V10a5 5 0 0 0-.7 0 4.9 4.9 0 1 0 4.9 4.9V9.6a6 6 0 0 0 3.3 1V8a3.6 3.6 0 0 1-3.4-3z"
        transform="translate(0.5 -0.4)"
      />
      <path
        fill="#fff"
        d="M15.2 5h-2.6v9.9a2.2 2.2 0 1 1-2.2-2.2c.2 0 .5 0 .7.1V10a5 5 0 0 0-.7 0 4.9 4.9 0 1 0 4.9 4.9V9.6a6 6 0 0 0 3.3 1V8a3.6 3.6 0 0 1-3.4-3z"
      />
    </svg>
  );
}

function Snapchat({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="6" fill="#FFFC00" />
      <path
        fill="#fff"
        stroke="#000"
        strokeWidth="0.9"
        d="M12 4.6c2.4 0 4.2 1.8 4.2 4.3v1.6c.4.2.9.1 1.3 0 .4-.1.9.1 1 .5.1.4-.2.7-.6.9-.5.2-1.2.4-1.4 1 0 .2 0 .4.1.6.6 1.3 1.7 2.2 3 2.6.3.1.4.4.2.7-.4.6-1.4.8-2.1 1-.2 0-.3.2-.4.5-.1.3-.2.6-.6.6-.5 0-1-.2-1.7-.2-.4 0-.8.1-1.2.4-.6.4-1.2.9-1.8.9s-1.2-.5-1.8-.9c-.4-.3-.8-.4-1.2-.4-.7 0-1.2.2-1.7.2-.4 0-.5-.3-.6-.6-.1-.3-.2-.5-.4-.5-.7-.2-1.7-.4-2.1-1-.2-.3-.1-.6.2-.7 1.3-.4 2.4-1.3 3-2.6.1-.2.1-.4.1-.6-.2-.6-.9-.8-1.4-1-.4-.2-.7-.5-.6-.9.1-.4.6-.6 1-.5.4.1.9.2 1.3 0V8.9c0-2.5 1.8-4.3 4.2-4.3z"
      />
    </svg>
  );
}

function Google({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#fff" />
      <g transform="translate(8 8) scale(0.667)">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </g>
    </svg>
  );
}

function WhatsApp({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path
        fill="#fff"
        d="M12 5.1a6.8 6.8 0 0 0-5.8 10.4L5.2 19l3.6-1a6.8 6.8 0 1 0 3.2-12.9zm3.9 9.6c-.2.5-1 .9-1.4 1-.4 0-.8.2-2.6-.6-2.2-1-3.6-3.2-3.7-3.3-.1-.2-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.8.2-.2.4-.3.6-.3h.4c.1 0 .3-.1.5.4l.7 1.7c.1.1.1.3 0 .4l-.3.4-.4.4c-.1.1-.2.3-.1.5.1.2.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.6-.8c.2-.2.3-.2.5-.1l1.5.7c.2.1.4.2.4.3.1 0 .1.4-.1.9z"
      />
    </svg>
  );
}

function YouTube({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="1" y="4.5" width="22" height="15" rx="4" fill="#FF0000" />
      <path fill="#fff" d="M10 9v6l5.2-3z" />
    </svg>
  );
}

function XBrand({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="6" fill="#000" />
      <path
        fill="#fff"
        d="M13.4 10.9 18.6 5h-1.5l-4.4 5.1L9.2 5H5l5.5 8-5.5 6.4h1.5l4.7-5.5 3.8 5.5H19l-5.6-8.1zm-1.6 1.9-.6-.8-4.3-6.1h1.9l3.6 5.1.5.8 4.6 6.5h-1.9l-3.8-5.5z"
      />
    </svg>
  );
}

/** Clés = valeurs stables des options du questionnaire. */
export const BRAND_ICONS: Record<string, (props: BrandIconProps) => React.JSX.Element> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: TikTok,
  snapchat: Snapchat,
  google: Google,
  whatsapp: WhatsApp,
  youtube: YouTube,
  x: XBrand,
  twitter: XBrand,
};

/**
 * Résout l'icône d'une option : marque officielle d'après la valeur stable
 * (ou un nom d'icône `brand:xxx`), sinon null (l'appelant utilisera Lucide).
 */
export function brandIconFor(
  value: string,
  iconName?: string,
): ((p: BrandIconProps) => React.JSX.Element) | null {
  if (iconName?.startsWith('brand:')) {
    return BRAND_ICONS[iconName.slice(6)] ?? null;
  }
  const key = value.toLowerCase().split('_')[0];
  return BRAND_ICONS[key] ?? BRAND_ICONS[value.toLowerCase()] ?? null;
}
