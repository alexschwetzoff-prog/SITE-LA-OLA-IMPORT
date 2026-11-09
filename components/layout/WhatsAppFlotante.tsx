import { enlaceWhatsApp } from '@/lib/site';
import { IconoWhatsApp } from './Iconos';

/** Bouton flottant WhatsApp, en mobile seulement (en bureau, WhatsApp est dans le pied de page et les pages contact). */
export default function WhatsAppFlotante() {
  return (
    <a
      href={enlaceWhatsApp()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nous écrire sur WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-marine text-white shadow-lg shadow-marine/30 transition-[background-color,transform] hover:bg-indigo-700 active:scale-95 lg:hidden"
    >
      <IconoWhatsApp className="h-7 w-7" />
    </a>
  );
}
