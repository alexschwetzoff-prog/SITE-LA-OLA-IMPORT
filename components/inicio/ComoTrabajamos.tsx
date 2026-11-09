import { Seccion } from '@/components/ui/Seccion';
import Constelacion, { type Paso } from './Constelacion';

// Los cinco pasos de la sección 4; los plazos son solo los de CLAUDE.md.
const PASOS: Paso[] = [
  { titulo: 'Nos cuentas tu idea', texto: 'O nos mandas tu diseño, por la web, WhatsApp o en persona.' },
  { titulo: 'Presupuesto en 24 h laborables', texto: 'Te asesoramos y te enviamos el presupuesto.' },
  { titulo: 'Muestrario en tu local', texto: 'En la ciudad de Valencia: tocas las calidades, te pruebas las tallas y ves los colores.' },
  { titulo: 'Personalizamos tu pedido', texto: 'Lo tienes en unas 2 semanas desde que lo confirmas.' },
  { titulo: 'Entrega y tu opinión', texto: 'Entregamos en toda España y te pedimos tu opinión.' },
];

/** Escala 6: cómo trabajamos, cinco pasos unidos como una constelación. Ancla #como-trabajamos (menú). */
export default function ComoTrabajamos() {
  return (
    <Seccion id="como-trabajamos" escala={6} nombre="Cómo trabajamos" etiqueta="Cómo trabajamos" titulo="Cinco pasos, de tu idea a tu local." ancho="ancho">
      <Constelacion pasos={PASOS} />
    </Seccion>
  );
}
