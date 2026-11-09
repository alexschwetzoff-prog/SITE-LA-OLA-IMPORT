-- Esquema inicial heredado de la spec de la base (docs/SPEC.md, secciones 8 y 9).
-- SOLO ESTRUCTURA: sin datos. En la base original nunca llegó a aplicarse (la v1 envía el formulario por email
-- y no tiene base de datos). Revisar antes de aplicarlo en el proyecto de Supabase propio de [MARCA] (región UE, RLS).

create table reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  estado text not null default 'pendiente'
    check (estado in ('pendiente','publicada','oculta')),
  nota smallint not null check (nota between 1 and 5),
  nota_calidad smallint, nota_plazo smallint, nota_trato smallint,
  texto text not null,
  autor_nombre text not null,
  autor_cargo text,
  negocio text not null,
  sector text,
  ciudad text,
  producto text,
  foto_path text,               -- bucket review-media
  logo_path text,
  idioma text default 'es',
  traducida boolean default false,
  permiso_publicacion boolean not null,
  es_ejemplo boolean not null default false,  -- solo desarrollo
  pedido_ref text               -- interno, nunca se muestra
);
alter table reviews enable row level security;
-- anon puede insertar solo con estado = 'pendiente' y es_ejemplo = false
-- anon puede leer solo estado = 'publicada' and permiso_publicacion and not es_ejemplo
-- cambiar estado: solo el equipo (service role)

create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  origen text not null,            -- 'formulario' | 'estudio' | 'home'
  nombre text not null,
  negocio text not null,
  sector text,
  ciudad text,
  email text not null,
  telefono text,
  contacto_preferido text,         -- 'whatsapp' | 'llamada' | 'email'
  productos text[],
  tramo text,                      -- '<25' | '25-50' | '50-150' | '150+'
  uso text,                        -- 'venta-local' | 'packs' | 'equipo' | 'evento'
  fecha_limite date,
  mensaje text not null,
  diseno jsonb,                    -- salida del estudio: producto, color, posiciones, tamaños, categoría de tarifa
  archivos text[],                 -- rutas en lead-files
  cita text,                       -- 'no' | 'su-local' (sin videollamada: decisión del 12/10/2026)
  franja_cita text,
  privacidad_aceptada boolean not null check (privacidad_aceptada),
  estado text not null default 'nuevo'  -- 'nuevo' | 'contactado' | 'presupuestado' | 'ganado' | 'perdido'
);
alter table leads enable row level security;
-- sin políticas para anon: solo escribe el servidor con service role
