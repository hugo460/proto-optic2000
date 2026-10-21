'use client';
import { Icon } from '@/components/ui/icon';
import type { OptionParam, Selection } from '@/lib/lens-selection';
function statusMessage(selection: Selection): string {
  const colour = selection.chosen.couleur?.name;
  const sphere = selection.chosen.sphere?.name;
  if (selection.status === 'complete') return `Votre sélection : couleur ${colour}, sphère ${sphere}.`;
  if (selection.status === 'incompatible') return 'Cette combinaison n’existe pas dans le catalogue public. Choisissez une autre couleur ou une autre sphère.';
  if (colour) return `Couleur ${colour} choisie. Choisissez maintenant la sphère pour compléter votre sélection.`;
  if (sphere) return `Sphère ${sphere} choisie. Choisissez maintenant une couleur pour compléter votre sélection.`;
  return 'Choisissez une couleur, puis une sphère.';
}
export function LensPicker({ selection, onChange }: { selection: Selection; onChange: (param: OptionParam, value: string | null) => void }) {
  const colour = selection.options.find(o => o.param === 'couleur');
  const sphere = selection.options.find(o => o.param === 'sphere');
  return <div className="lens-picker">
    {colour && <fieldset className="variant-picker"><legend>1. Choisissez la couleur</legend><div className="lens-colours">{colour.terms.map(term => {
      const pressed = selection.chosen.couleur?.slug === term.slug;
      return <button type="button" key={term.slug} className="variant-option lens-colour" aria-pressed={pressed} onClick={() => onChange('couleur', term.slug)}><span>{term.name}</span><span className="variant-check">{pressed && <Icon name="check" />}</span></button>;
    })}</div></fieldset>}
    {sphere && <div className="lens-sphere"><label htmlFor="lens-sphere">2. Choisissez la sphère</label><select id="lens-sphere" value={selection.chosen.sphere?.slug ?? ''} aria-describedby="lens-sphere-help" onChange={event => onChange('sphere', event.target.value || null)}><option value="">Sphère à choisir</option>{sphere.terms.map(term => <option key={term.slug} value={term.slug}>{term.name}</option>)}</select><p id="lens-sphere-help">Valeurs proposées par le catalogue public, de {sphere.terms[0].name} à {sphere.terms[sphere.terms.length - 1].name}. {selection.product.variants.every(v => !v.attributes[sphere.key]) && ' Chaque couleur correspond à une seule référence, compatible avec toutes ces sphères : la sphère choisie accompagne votre demande.'}</p></div>}
    <p className={`lens-status${selection.status === 'complete' ? ' is-complete' : ''}`} role="status">{selection.status === 'complete' && <Icon name="check" />}{statusMessage(selection)}</p>
  </div>;
}
