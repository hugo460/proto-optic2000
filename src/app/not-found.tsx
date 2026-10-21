import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
export default function NotFound() { return <div className="container error-page"><h1>Cette page nous<br />échappe.</h1><p>Le lien a peut-être changé. Retrouvez nos collections ou les coordonnées de votre magasin.</p><div className="error-actions"><Link className="action action-primary" href="/solaires">Découvrir les solaires<Icon name="arrow" /></Link><Link className="action action-secondary" href="/magasins">Trouver un magasin<Icon name="pin" /></Link></div></div>; }
