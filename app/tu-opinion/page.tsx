import type { Metadata } from 'next';
import { IconoWhatsApp } from '@/components/layout/Iconos';
import { ESTILO_BOTON } from '@/components/ui/Botones';
import { Pagina } from '@/components/ui/Pagina';
import { SITE, enlaceWhatsApp } from '@/lib/site';

// Enlace privado que se manda al cliente tras la entrega: no se indexa. El formulario de opinión llega con la fase 7;
// hasta entonces la página pide la opinión por WhatsApp o email.
export const metadata: Metadata = { title: 'Tu opinión', robots: { index: false, follow: false } };

export default function TuOpinion() {
  return (
    <Pagina titulo="Tu opinión">
      <p className="mt-6 max-w-2xl text-lg text-mist-300">Gracias por contar con [MARCA]. Nos ayuda mucho saber qué tal ha ido tu pedido: la calidad, el plazo y el trato.</p>
      <div className="mt-8 max-w-2xl rounded-3xl border border-moon-50/10 bg-space-900/50 p-6 sm:p-8">
        <p className="text-mist-300">
          Cuéntanoslo por WhatsApp o por email, en dos líneas o en las que quieras. Si te parece bien que publiquemos tu opinión con el nombre de tu negocio, dínoslo en el mismo mensaje: no editamos su contenido y solo la publicamos con tu permiso.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={enlaceWhatsApp()} target="_blank" rel="noopener noreferrer" className={ESTILO_BOTON.principal}>
            <IconoWhatsApp className="h-4 w-4" />
            Contar mi opinión por WhatsApp
          </a>
          <a href={`mailto:${SITE.email}?subject=${encodeURIComponent('Mi opinión sobre el pedido')}`} className={ESTILO_BOTON.secundario}>
            Escribir a {SITE.email}
          </a>
        </div>
      </div>
    </Pagina>
  );
}
