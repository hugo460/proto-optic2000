import type { CSSProperties } from 'react';
const paths = {
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  back: 'M20 12H4m6-6-6 6 6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'm6 6 12 12M6 18 18 6',
  pin: 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  phone: 'M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a14 14 0 0 1-7-7l2-2-2-5Z',
  mail: 'M3 5h18v14H3V5Zm0 1 9 7 9-7',
  search: 'M16.5 16.5 21 21M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  filter: 'M4 7h16M4 17h16M8 4v6M16 14v6',
  chevron: 'm6 9 6 6 6-6',
  external: 'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',
  check: 'm4 12 5 5L20 6',
} as const;
export function Icon({ name, className, style }: { name: keyof typeof paths; className?: string; style?: CSSProperties }) {
  return <svg className={className} style={style} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
