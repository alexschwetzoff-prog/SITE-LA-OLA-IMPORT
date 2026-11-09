import { ViewTransition } from 'react';

// La plantilla se remonta en cada navegación: así cada página sale (se aleja) y entra (llega desde el fondo).
// Las animaciones viven en globals.css y se anulan con prefers-reduced-motion.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="nave-llegada" exit="nave-salida" default="none">
      {children}
    </ViewTransition>
  );
}
