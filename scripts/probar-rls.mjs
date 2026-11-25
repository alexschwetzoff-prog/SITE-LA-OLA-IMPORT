#!/usr/bin/env node
// Ejecuta supabase/tests/rls.sql contra la pila local (docker compose en supabase/local). Falla si alguna política falla.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const r = spawnSync('docker', ['exec', '-i', 'laola-supabase-local-db-1', 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1'], {
  input: readFileSync(new URL('../supabase/tests/rls.sql', import.meta.url), 'utf8'),
  encoding: 'utf8',
});
const salida = `${r.stdout}\n${r.stderr}`;
console.log(salida.split('\n').filter((l) => /NOTICE|ERROR|FALLO/.test(l)).map((l) => l.replace(/^psql:.*?NOTICE:\s*/, '').trim()).join('\n'));
if (r.status !== 0 || /FALLO|ERROR/.test(salida)) { console.error('RLS: HAY FALLOS'); process.exit(1); }
console.log('RLS: todo correcto');
