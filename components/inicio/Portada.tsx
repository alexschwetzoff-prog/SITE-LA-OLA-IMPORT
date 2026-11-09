import { BotonEnlace } from '@/components/ui/Botones';
import { TEXTOS } from '@/lib/site';
import { IconoEntrega, IconoReloj, IconoSede } from './Iconos';
import OjoDeBuey from './OjoDeBuey';

const DATOS = [
  { icono: IconoSede, texto: TEXTOS.datosCatalogo[0] },
  { icono: IconoReloj, texto: TEXTOS.datosCatalogo[1] },
  { icono: IconoEntrega, texto: TEXTOS.datosCatalogo[2] },
];

/** Escala 1, despegue: titular literal, botones, los tres datos del catálogo y el ojo de buey con la portada. */
export default function Portada() {
  return (
    <section id="inicio" data-escala="1" data-nombre="Despegue" className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-28 pb-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pt-40 lg:pb-20">
      {/* data-cielo-evitar: el OVNI del fondo no sobrevuela el texto ni los botones de la primera pantalla (fase 4.6) */}
      <div data-cielo-evitar>
        <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-tight text-moon-50 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
          Tu logo en camisetas, sudaderas y merchandising para tu negocio.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-mist-300 sm:text-xl">
          Personalizamos textil con impresión digital y merchandising para negocios que quieren que sus clientes lleven su marca puesta. Con sede en Valencia.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <BotonEnlace href="#pruebalo" tamano="grande">
            Pruébalo con tu logo
          </BotonEnlace>
          <BotonEnlace href="/catalogo" variante="secundario" tamano="grande">
            Ver catálogo
          </BotonEnlace>
        </div>
        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-mist-300">
          {DATOS.map(({ icono: Icono, texto }) => (
            <li key={texto} className="flex items-center gap-2">
              <Icono className="h-5 w-5 text-star-300" />
              {texto}
            </li>
          ))}
        </ul>
      </div>
      <OjoDeBuey />
    </section>
  );
}
