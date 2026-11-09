import { BotonEnlace, Flecha } from '@/components/ui/Botones';
import { Seccion } from '@/components/ui/Seccion';
import { EQUIPE } from '@/data/equipe';
import CarteMembre from './CarteMembre';

/** « Qui sommes-nous » en bref : les visages de l'atelier. La transparence sur l'équipe rassure, surtout en B2B. */
export default function EquipeApercu() {
  return (
    <Seccion id="qui-sommes-nous" etiqueta="Qui sommes-nous" titulo="Derrière chaque impression, il y a des visages." fond="perle">
      <ul className="mt-8 grid max-w-3xl grid-cols-2 gap-4 sm:gap-6">
        {EQUIPE.map((m) => (
          <li key={m.prenom}>
            <CarteMembre membre={m} />
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <BotonEnlace href="/qui-sommes-nous" variante="secundario">
          Rencontrer l’équipe
          <Flecha />
        </BotonEnlace>
      </div>
    </Seccion>
  );
}
