import clsx from 'clsx';

/**
 * Logo VenuD'où — utilise les placeholders de public/brand/.
 * Remplacer les fichiers SVG par le logo validé (mêmes noms).
 */
export function Logo({ variant = 'full', className }: { variant?: 'full' | 'mark'; className?: string }) {
  if (variant === 'mark') {
    return (
      <img
        src="/brand/logo-mark.svg"
        alt="VenuD'où"
        width={40}
        height={40}
        className={clsx('h-10 w-10', className)}
      />
    );
  }
  return (
    <img
      src="/brand/logo-full.svg"
      alt="VenuD'où"
      width={165}
      height={36}
      className={clsx('h-9 w-auto', className)}
    />
  );
}
