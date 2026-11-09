import { IconoWhatsApp } from '@/components/layout/Iconos';
import { BotonEnlace, ESTILO_BOTON } from '@/components/ui/Botones';
import { Seccion } from '@/components/ui/Seccion';
import { SITE, enlaceWhatsApp } from '@/lib/site';
import { IconoSede } from './Iconos';

/**
 * Escala 7: toca las calidades en persona (decisión del equipo, 12/10/2026). Solo ofrecemos ir al local del
 * cliente, en la ciudad de Valencia, con el muestrario; sin videollamada.
 */
export default function Visita() {
  return (
    <Seccion id="visita" escala={7} nombre="Toca las calidades" etiqueta="Muestrario en tu local" titulo="Toca las calidades en persona." intro="Las fotos ayudan; tocar la tela decide.">
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div className="rounded-3xl border border-moon-50/10 bg-space-900/50 p-6 sm:p-8">
          <p className="text-lg text-moon-50">
            Vamos a tu local en la ciudad de Valencia con el muestrario: tocas las calidades, te pruebas las tallas y ves los colores.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <BotonEnlace href="/proyecto?cita=local" tamano="grande">
              Pide que te visitemos
            </BotonEnlace>
            <a href={enlaceWhatsApp()} target="_blank" rel="noopener noreferrer" className={ESTILO_BOTON.secundario}>
              <IconoWhatsApp className="h-4 w-4" />
              Por WhatsApp
            </a>
          </div>
        </div>
        <address className="flex gap-4 rounded-3xl border border-moon-50/10 p-6 text-sm text-mist-300 not-italic">
          <IconoSede className="h-6 w-6 shrink-0 text-star-300" />
          <div>
            <p className="font-medium text-moon-50">Nuestra base</p>
            <a href={SITE.direccion.mapaUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block hover:text-moon-50">
              {SITE.direccion.calle}
              <br />
              {SITE.direccion.barrio} · {SITE.direccion.cp} {SITE.direccion.ciudad}
            </a>
            <p className="mt-3">{SITE.horario}</p>
          </div>
        </address>
      </div>
    </Seccion>
  );
}
