import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Fase 6 y fase 9: el formulario de /proyecto manda el logo y las capturas en la acción de servidor. Las funciones de
  // Netlify cortan el cuerpo de cada petición en 6 MB ya codificado en base64 (unos 4,5 MB reales), y Vercel en 4,5 MB:
  // MAX_ENVIO_BYTES (lib/solicitud/comun.ts) deja 4 MB para los adjuntos y el resto es margen para los campos.
  experimental: { serverActions: { bodySizeLimit: '4500kb' } },
  // Fase 9: nada del repositorio que no necesite la función del servidor entra en su paquete. El rastreador de
  // archivos de Next incluye lo que el código parece leer en tiempo de ejecución; el transporte de pruebas del correo
  // escribe en una carpeta que depende del entorno y, sin estas exclusiones, el rastreo metía el repositorio entero
  // (assets, docs con las fichas del proveedor, public, video...: 1,1 GB) en la función de Netlify.
  outputFileTracingExcludes: {
    '*': ['./assets/**', './docs/**', './public/**', './video/**', './archivo/**', './scripts/**', './.correo-local/**', './.netlify/**', './.claude/**', './*.md'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // 90 para las fotos de producto (fase 4.2: el recoloreado no se vuelve a degradar al servirlo); 75 para el resto
    qualities: [75, 90],
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
