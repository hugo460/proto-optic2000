import type { Metadata } from 'next';
import { brands } from '@/data';
import { editorialMedia } from '@/data/content';
import { BrandTiles, ContactPrompt, EditorialHeader, ReadingSection, SourceNote } from '@/components/content/editorial';
import { MediaImage } from '@/components/ui/media-image';
export const metadata: Metadata = { title: 'Jumelles et télescopes', description: 'Jumelles et télescopes Bosma, Celestron et Perl, avec le conseil des opticiens Optic 2000 Tahiti.' };
export default function ObservationPage() {
  const observationBrands = ['bosma', 'celestron', 'perl'].map(id => brands.find(b => b.id === id)!);
  return <div className="container editorial-page">
    <EditorialHeader title="Jumelles et télescopes.">
      <p>De l’astronomie à l’observation des baleines, en passant par l’ornithologie et la randonnée, nos équipes vous guident vers l’instrument adapté à votre pratique, à votre niveau et à votre budget.</p>
    </EditorialHeader>
    <ReadingSection id="jumelles" title="Jumelles" media={<figure className="object-plate"><MediaImage media={editorialMedia.binoculars} alt="Jumelles Celestron noires, photographiées sur fond blanc." sizes="(max-width: 800px) 90vw, 30vw" /></figure>}>
      <p>Une bonne paire de jumelles accompagne vos passions. De nombreux critères sont à prendre en compte au moment de l’achat : notre équipe est là pour vous guider.</p>
    </ReadingSection>
    <ReadingSection id="telescopes" title="Télescopes" media={<figure className="object-plate"><MediaImage media={editorialMedia.telescope} alt="Instrument d’observation astronomique Perl monté sur son trépied." sizes="(max-width: 800px) 90vw, 30vw" /></figure>}>
      <p>Les télescopes accompagnent les astronomes en herbe : chasser les étoiles est à portée de main.</p>
      <p>Notre équipe vous guide dans votre achat en fonction de votre niveau et de votre budget.</p>
    </ReadingSection>
    <p className="media-note">Instruments photographiés sur l’ancienne page (2022). Modèles, références et disponibilités sont à confirmer en magasin.</p>
    <ReadingSection id="marques" title="Les marques">
      <p>Bosma, Celestron et Perl sont les marques présentées sur l’ancienne page. Les instruments ne sont pas vendus en ligne.</p>
    </ReadingSection>
    <BrandTiles brands={observationBrands} label="Marques de jumelles et télescopes" showDestination={false} />
    <ContactPrompt subject="observation" title="Un instrument à choisir ?">Indiquez votre pratique et vos questions : la demande est préparée pour le magasin de votre choix.</ContactPrompt>
    <SourceNote pages={['jumelles-et-telescopes']} />
  </div>;
}
