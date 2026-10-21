'use client';
import Link from 'next/link';
export default function Error({ reset }: { reset: () => void }) { return <div className="container error-page"><h1>Une interruption<br />passagère.</h1><p>La page n’a pas pu être chargée. Réessayez ou retrouvez les coordonnées de nos magasins.</p><div className="error-actions"><button className="action action-primary" onClick={reset}>Réessayer</button><Link className="action action-secondary" href="/magasins">Nos magasins</Link></div></div>; }
