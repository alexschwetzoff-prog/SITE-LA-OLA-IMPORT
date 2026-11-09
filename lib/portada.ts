// Vídeo de portada (sección 4 de la spec): se produce aparte con Remotion (video/, 14 s en bucle, sin audio) y la web
// solo lo reproduce en el ojo de buey del hero (components/inicio/OjoDeBuey.tsx). Archivos en public/portada/: WebM
// (VP9) y MP4 (H.264) de 1040 × 1040 (2× del hueco de 520 px) y el póster, que es el fotograma final del vídeo
// (logotipo y eslogan) a 1040, 780 y 520 px (pantallas de 2×, 1,5× y 1×): hace de imagen principal de la página
// (LCP) y es lo único que se ve con prefers-reduced-motion. El vídeo se carga después de la página, en tiempo libre.

export const IMAGEN_PORTADA = {
  src: '/portada/portada.webp',
  srcSet: '/portada/portada-520.webp 520w, /portada/portada-780.webp 780w, /portada/portada.webp 1040w',
  ancho: 1040,
  alto: 1040,
  alt: 'Logotipo de [MARCA] con el eslogan «[LEMA]»',
};

export const VIDEO_PORTADA: { mp4: string; webm: string } | null = {
  mp4: '/portada/portada.mp4',
  webm: '/portada/portada.webm',
};
