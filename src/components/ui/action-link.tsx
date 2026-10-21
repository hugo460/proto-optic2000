import Link from 'next/link';
import { Icon } from './icon';
import type { ReactNode } from 'react';
export function ActionLink({ href, children, variant = 'primary', className = '' }: { href: string; children: ReactNode; variant?: 'primary' | 'secondary' | 'text'; className?: string }) {
  return <Link className={`action action-${variant} ${className}`} href={href}>{children}<Icon name="arrow" /></Link>;
}
