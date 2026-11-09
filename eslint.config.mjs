import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // El vídeo de portada es un proyecto aparte (Remotion) con su propio tsc; no forma parte del build de la web.
    "video/**",
    // Salida de la CLI de Netlify al probar el build en local (fase 9); git la ignora.
    ".netlify/**",
  ]),
]);

export default eslintConfig;
