import { enlaceWhatsApp } from '@/lib/site';
import { IconoWhatsApp } from './Iconos';

/** Botón flotante de WhatsApp, solo en móvil (en escritorio va en la cabecera). */
export default function WhatsAppFlotante() {
  return (
    <a
      href={enlaceWhatsApp()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-nova-600 text-white shadow-lg shadow-nova-600/40 transition-[background-color,transform] hover:bg-nova-400 active:scale-95 lg:hidden"
    >
      <IconoWhatsApp className="h-7 w-7" />
    </a>
  );
}
