// Gancho de resolución para ejecutar módulos TypeScript del repositorio con Node sin compilar: Node ya quita los
// tipos, pero no resuelve ni el alias «@/» de tsconfig ni los imports relativos sin extensión («./categorias»).
// Uso: node --import ./scripts/cargador-ts.mjs scripts/marca/exportar-og.mts
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const raiz = pathToFileURL(process.cwd() + '/').href;

register(
  'data:text/javascript,' +
    encodeURIComponent(`
  import { existsSync } from 'node:fs';
  import { fileURLToPath, pathToFileURL } from 'node:url';
  import path from 'node:path';
  const RAIZ = ${JSON.stringify(raiz)};
  const EXTENSIONES = ['.ts', '.mts', '.tsx', '.mjs', '.js', '.json'];
  function conExtension(ruta) {
    if (path.extname(ruta) && existsSync(ruta)) return ruta;
    for (const ext of EXTENSIONES) if (existsSync(ruta + ext)) return ruta + ext;
    return null;
  }
  export async function resolve(specifier, context, next) {
    let ruta = null;
    if (specifier.startsWith('@/')) ruta = path.resolve(fileURLToPath(RAIZ), specifier.slice(2));
    else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
      ruta = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    }
    if (ruta) {
      const real = conExtension(ruta);
      if (real) return next(pathToFileURL(real).href, context);
    }
    return next(specifier, context);
  }
`),
);
