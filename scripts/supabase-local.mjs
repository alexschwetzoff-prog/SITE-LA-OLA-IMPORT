#!/usr/bin/env node
// Utilidades de la pila local de Supabase (supabase/local/docker-compose.yml).
//   node scripts/supabase-local.mjs migrar                     aplica supabase/migrations/*.sql (en orden) y supabase/seed.sql
//   node scripts/supabase-local.mjs crear-admin correo@x.fr    promueve a admin y valida una cuenta YA registrada
//   node scripts/supabase-local.mjs precios-demo               carga precios FICTICIOS para probar el carrito (solo pila local)
//   node scripts/supabase-local.mjs claves                      crea supabase/local/.env.local-stack (secreto JWT aleatorio y claves anon/service firmadas) si no existe
//   node scripts/supabase-local.mjs sql "select 1"             ejecuta una consulta como superusuario
// Con un proyecto real de Supabase: SQL editor del panel (ver docs/ESPACIO-CLIENTE.md); este script solo habla con Docker.
import { execFileSync } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DB = 'laola-supabase-local-db-1';
const psql = (sql) => execFileSync('docker', ['exec', '-i', DB, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tA'], { input: sql, encoding: 'utf8' });
const [, , cmd, arg] = process.argv;

if (cmd === 'claves') {
  const ruta = new URL('../supabase/local/.env.local-stack', import.meta.url).pathname;
  if (existsSync(ruta)) { console.log('ya existe', ruta); process.exit(0); }
  const secreto = randomBytes(32).toString('hex');
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const jwt = (role) => {
    const cuerpo = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ iss: 'supabase-local', role, iat: 1700000000, exp: 4102444800 })}`;
    return `${cuerpo}.${createHmac('sha256', secreto).update(cuerpo).digest('base64url')}`;
  };
  writeFileSync(ruta, `# Claves SOLO para la pila local de desarrollo. Generadas por scripts/supabase-local.mjs claves (git las ignora).\nJWT_SECRET=${secreto}\nANON_KEY=${jwt('anon')}\nSERVICE_ROLE_KEY=${jwt('service_role')}\n`);
  console.log('creado', ruta, '\nPon en .env.local: NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 y NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY del archivo>');
  process.exit(0);
}
if (cmd === 'migrar') {
  const dir = new URL('../supabase/migrations/', import.meta.url).pathname;
  psql("create table if not exists public._migraciones (nombre text primary key, aplicada timestamptz default now());");
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    if (psql(`select 1 from public._migraciones where nombre = '${f}'`).trim()) { console.log('ya aplicada', f); continue; }
    psql(readFileSync(join(dir, f), 'utf8') + `\ninsert into public._migraciones (nombre) values ('${f}');`);
    console.log('aplicada', f);
  }
  // PostgREST guarda el esquema en caché: sin esto no ve las tablas nuevas hasta reiniciarse.
  psql("notify pgrst, 'reload schema'");
} else if (cmd === 'crear-admin') {
  if (!arg || !/^[^'\s]+@[^'\s]+$/.test(arg)) { console.error('Indica el correo de una cuenta ya registrada.'); process.exit(1); }
  const n = psql(`update public.perfiles set rol = 'admin', estado = 'validada' where id = (select id from auth.users where email = '${arg}') returning 1`).trim();
  console.log(n ? `${arg} es ahora admin y está validada.` : 'No existe esa cuenta: regístrala primero en /inscription.');
} else if (cmd === 'precios-demo') {
  // Importes inventados, SOLO para probar en local. Los precios reales se cargan cuando La Ola Import los confirme.
  psql(`insert into public.precios (producto_slug, variante, cantidad_minima, precio_ht) values
    ('eris', null, 6, 4.20), ('eris', 'Rouge', 12, 3.90), ('serviette-plage-70x140', null, 12, 6.50), ('atomic-150', null, 1, 3.50)
    on conflict do nothing;`);
  console.log('Precios de prueba cargados (ficticios).');
} else if (cmd === 'sql') {
  console.log(psql(arg ?? 'select 1'));
} else {
  console.error('Uso: migrar | crear-admin <correo> | sql "<consulta>"');
  process.exit(1);
}
