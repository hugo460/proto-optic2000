'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/icon';

// Keep the shared footer server-rendered; only this action depends on the current route.
export function FooterVisitAction() {
  const onAppointment = usePathname() === '/rendez-vous';
  return <Link className={`action action-${onAppointment ? 'text' : 'primary'}`} href={onAppointment ? '/contact' : '/rendez-vous'}>{onAppointment ? 'Préparer une demande' : 'Préparer un rendez-vous'}<Icon name="arrow" /></Link>;
}
