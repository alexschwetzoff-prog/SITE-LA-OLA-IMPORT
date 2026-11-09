import type { Metadata } from 'next';
import Aterrizaje from '@/components/inicio/Aterrizaje';
import CatalogoDestacado from '@/components/inicio/CatalogoDestacado';
import ComoTrabajamos from '@/components/inicio/ComoTrabajamos';
import Opiniones from '@/components/inicio/Opiniones';
import PanelDeMandos from '@/components/inicio/PanelDeMandos';
import ParaQuien from '@/components/inicio/ParaQuien';
import Portada from '@/components/inicio/Portada';
import PruebaLogo from '@/components/inicio/PruebaLogo';
import QueHacemos from '@/components/inicio/QueHacemos';
import Visita from '@/components/inicio/Visita';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: SITE.tituloPorDefecto },
  description: SITE.descripcion,
  alternates: { canonical: '/' },
};

// La home es estática: el viaje en nueve escalas (sección 4), del despegue al aterrizaje.
export const ensureStatic = 'navigation';

export default function Inicio() {
  return (
    <>
      <PanelDeMandos />
      <Portada />
      <QueHacemos />
      <ParaQuien />
      <CatalogoDestacado />
      <PruebaLogo />
      <ComoTrabajamos />
      <Visita />
      <Opiniones />
      <Aterrizaje />
    </>
  );
}
