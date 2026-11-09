import type { Metadata } from 'next';
import { Apartado, Correo, PaginaLegal } from '@/components/legal/Legal';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Política de cookies',
  description: 'dominio-pendiente.example no usa cookies publicitarias ni analíticas: solo almacenamiento técnico para el estudio de diseño y los filtros del catálogo.',
  alternates: { canonical: '/cookies' },
};

export default function Cookies() {
  return (
    <PaginaLegal titulo="Política de cookies">
      <Apartado titulo="Qué usa esta web">
        dominio-pendiente.example no usa cookies publicitarias, analíticas ni de seguimiento. Solo usa almacenamiento técnico
        estrictamente necesario, por ejemplo para conservar en tu navegador el logo y el diseño mientras usas el estudio o
        para recordar los filtros del catálogo. Las visitas se miden de forma agregada y sin cookies.
      </Apartado>

      <Apartado titulo="Servicios externos">
        Las fuentes tipográficas se sirven desde nuestro propio dominio. La ubicación de nuestra sede es un enlace a Google
        Maps, que aplica sus propias cookies al abrirlo; en la web no se carga ningún mapa. Los botones de WhatsApp e
        Instagram te llevan a esas plataformas, que aplican sus propias cookies y políticas al abrirlas.
      </Apartado>

      <Apartado titulo="Base jurídica">
        El almacenamiento técnico no necesita consentimiento porque es imprescindible para el servicio que pides. Si en el
        futuro se incorporan herramientas como Google Analytics o el píxel de Meta, esta política se actualizará y se pedirá
        consentimiento previo con un panel configurable.
      </Apartado>

      <Apartado titulo="Cómo gestionarlas">
        Puedes permitir, bloquear o eliminar cookies y datos del sitio desde la configuración de tu navegador. Desactivar el
        almacenamiento técnico puede afectar al funcionamiento del estudio de diseño.
      </Apartado>

      <Apartado titulo="Contacto">
        <Correo email={SITE.titular.email} />.
      </Apartado>
    </PaginaLegal>
  );
}
