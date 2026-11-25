-- Espacio cliente profesional (25/11/2026): perfiles, precios, favoritos, carrito y pedidos, con RLS en TODAS las tablas.
-- Reglas: cada cliente solo ve y escribe lo suyo; los precios solo los lee una cuenta VALIDADA (o un admin); solo los
-- admins validan cuentas, cambian precios y estados de pedido. El pago y los emails oficiales se conectan en otra fase.
-- Esta migración se aplica DESPUÉS de que Supabase Auth haya creado el esquema `auth` (siempre ocurre en Supabase).

-- ============================================================ configuración (IVA en un solo sitio)
create table public.configuracion (
  clave text primary key,
  valor text not null,
  descripcion text
);
alter table public.configuracion enable row level security;
revoke all on public.configuracion from anon, authenticated;

-- ============================================================ perfiles
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',                       -- copia informativa para el panel de admin (la fija el trigger de alta)
  razon_social text not null default '',
  siret text not null default '' check (siret = '' or siret ~ '^[0-9]{14}$'),
  numero_tva text,
  nombre_contacto text not null default '',
  apellidos_contacto text not null default '',
  telefono text,
  direccion_facturacion text not null default '',
  codigo_postal text not null default '',
  ciudad text not null default '',
  pais text not null default 'FR',
  sector text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'validada', 'rechazada')),
  rol text not null default 'cliente' check (rol in ('cliente', 'admin')),
  motivo_rechazo text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  validado_en timestamptz
);
alter table public.perfiles enable row level security;
revoke all on public.perfiles from anon, authenticated;
grant select, update on public.perfiles to authenticated;

-- Funciones de apoyo (security definer: leen perfiles sin pasar por la RLS de perfiles, evitando recursión).
create function public.es_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin') $$;

create function public.es_validado() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.perfiles where id = auth.uid() and (estado = 'validada' or rol = 'admin')) $$;

revoke all on function public.es_admin(), public.es_validado() from public;
grant execute on function public.es_admin(), public.es_validado() to authenticated;

-- Al registrarse en Auth se crea el perfil con los datos de empresa que viajan en los metadatos del alta.
create function public.crear_perfil_al_registrarse() returns trigger
language plpgsql security definer set search_path = public as
$$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.perfiles (id, email, razon_social, siret, numero_tva, nombre_contacto, apellidos_contacto, telefono,
                               direccion_facturacion, codigo_postal, ciudad, pais, sector)
  values (new.id, coalesce(new.email, ''), coalesce(m ->> 'razon_social', ''), coalesce(m ->> 'siret', ''), nullif(m ->> 'numero_tva', ''),
          coalesce(m ->> 'nombre_contacto', ''), coalesce(m ->> 'apellidos_contacto', ''), nullif(m ->> 'telefono', ''),
          coalesce(m ->> 'direccion_facturacion', ''), coalesce(m ->> 'codigo_postal', ''), coalesce(m ->> 'ciudad', ''),
          coalesce(nullif(m ->> 'pais', ''), 'FR'), nullif(m ->> 'sector', ''));
  return new;
end
$$;
create trigger al_registrarse after insert on auth.users for each row execute function public.crear_perfil_al_registrarse();

-- Un cliente nunca cambia su estado, su rol ni las marcas de validación: solo un admin (o el servidor con service role).
create function public.proteger_perfil() returns trigger
language plpgsql as
$$
begin
  new.actualizado_en := now();
  if current_user in ('anon', 'authenticated') and not public.es_admin() then
    new.estado := old.estado;
    new.rol := old.rol;
    new.motivo_rechazo := old.motivo_rechazo;
    new.validado_en := old.validado_en;
    new.email := old.email;
    new.id := old.id;
  elsif new.estado is distinct from old.estado then
    new.validado_en := case when new.estado = 'validada' then now() else null end;
  end if;
  return new;
end
$$;
create trigger proteger_perfil before update on public.perfiles for each row execute function public.proteger_perfil();

create policy perfiles_leer_propio on public.perfiles for select to authenticated using (id = auth.uid() or public.es_admin());
create policy perfiles_editar_propio on public.perfiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy perfiles_admin_edita on public.perfiles for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- ============================================================ precios
create table public.precios (
  id uuid primary key default gen_random_uuid(),
  producto_slug text not null,
  variante text,                                        -- null = precio de todo el producto
  cantidad_minima integer not null default 1 check (cantidad_minima >= 1),   -- lote mínimo (o tramo)
  precio_ht numeric(10, 2) not null check (precio_ht >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create unique index precios_unico on public.precios (producto_slug, coalesce(variante, ''), cantidad_minima);
alter table public.precios enable row level security;
revoke all on public.precios from anon, authenticated;
grant select, insert, update, delete on public.precios to authenticated;
create policy precios_leer_validados on public.precios for select to authenticated using ((activo and public.es_validado()) or public.es_admin());
create policy precios_admin_escribe on public.precios for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- ============================================================ favoritos
create table public.favoritos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  producto_slug text not null,
  variante text not null default '',
  creado_en timestamptz not null default now(),
  unique (usuario_id, producto_slug, variante)
);
alter table public.favoritos enable row level security;
revoke all on public.favoritos from anon, authenticated;
grant select, insert, delete on public.favoritos to authenticated;
create policy favoritos_propios_leer on public.favoritos for select to authenticated using (usuario_id = auth.uid() and public.es_validado());
create policy favoritos_propios_crear on public.favoritos for insert to authenticated with check (usuario_id = auth.uid() and public.es_validado());
create policy favoritos_propios_borrar on public.favoritos for delete to authenticated using (usuario_id = auth.uid());

-- ============================================================ carrito
create table public.carritos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() unique references auth.users (id) on delete cascade,
  actualizado_en timestamptz not null default now()
);
create table public.lineas_carrito (
  id uuid primary key default gen_random_uuid(),
  carrito_id uuid not null references public.carritos (id) on delete cascade,
  producto_slug text not null,
  variante text not null default '',                    -- color o diseño elegido
  talla text not null default '',
  cantidad integer not null check (cantidad >= 1 and cantidad <= 100000),
  personalizacion jsonb,                                -- { tecnica, posicion, logo_ref } del estudio (opcional)
  creado_en timestamptz not null default now()
);
create unique index lineas_carrito_unica on public.lineas_carrito (carrito_id, producto_slug, variante, talla, coalesce(personalizacion::text, ''));
alter table public.carritos enable row level security;
alter table public.lineas_carrito enable row level security;
revoke all on public.carritos, public.lineas_carrito from anon, authenticated;
grant select, insert, update, delete on public.carritos, public.lineas_carrito to authenticated;
create policy carritos_propios on public.carritos for all to authenticated
  using (usuario_id = auth.uid() and public.es_validado()) with check (usuario_id = auth.uid() and public.es_validado());
create policy lineas_carrito_propias on public.lineas_carrito for all to authenticated
  using (exists (select 1 from public.carritos c where c.id = carrito_id and c.usuario_id = auth.uid()) and public.es_validado())
  with check (exists (select 1 from public.carritos c where c.id = carrito_id and c.usuario_id = auth.uid()) and public.es_validado());

-- ============================================================ pedidos (preparados; sin lógica de pago)
create sequence public.pedidos_numero_seq;
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default ('LO-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.pedidos_numero_seq')::text, 5, '0')),
  usuario_id uuid not null references auth.users (id) on delete restrict,
  estado text not null default 'pendiente_pago' check (estado in ('borrador', 'pendiente_pago', 'pagado', 'cancelado')),
  subtotal_ht numeric(12, 2) not null,
  tasa_iva numeric(5, 2) not null,
  importe_iva numeric(12, 2) not null,
  total_ttc numeric(12, 2) not null,
  datos_facturacion jsonb not null,                     -- copia de los datos de empresa en el momento del pedido
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create table public.lineas_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  producto_slug text not null,
  variante text not null default '',
  talla text not null default '',
  cantidad integer not null check (cantidad >= 1),
  precio_unitario_ht numeric(10, 2) not null,
  total_linea_ht numeric(12, 2) not null,
  personalizacion jsonb
);
alter table public.pedidos enable row level security;
alter table public.lineas_pedido enable row level security;
revoke all on public.pedidos, public.lineas_pedido from anon, authenticated;
grant select on public.pedidos, public.lineas_pedido to authenticated;
grant update (estado) on public.pedidos to authenticated;      -- solo un admin pasa la RLS; el cliente no puede
create policy pedidos_propios_leer on public.pedidos for select to authenticated using (usuario_id = auth.uid() or public.es_admin());
create policy pedidos_admin_estado on public.pedidos for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy lineas_pedido_leer on public.lineas_pedido for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and (p.usuario_id = auth.uid() or public.es_admin())));

-- El cliente NO inserta pedidos ni líneas: los crea esta función a partir de SU carrito y de la tabla precios, así nadie
-- puede fabricar importes. Devuelve el id del pedido (estado 'pendiente_pago').
create function public.crear_pedido_desde_carrito() returns uuid
language plpgsql security definer set search_path = public as
$$
declare
  uid uuid := auth.uid();
  v_perfil public.perfiles;
  v_carrito uuid;
  v_tasa numeric(5, 2);
  v_pedido uuid;
  v_subtotal numeric(12, 2) := 0;
  l record;
  p numeric(10, 2);
begin
  if uid is null then raise exception 'Connexion requise' using errcode = '28000'; end if;
  select * into v_perfil from public.perfiles where id = uid;
  if v_perfil.estado is distinct from 'validada' and v_perfil.rol is distinct from 'admin' then
    raise exception 'Compte non validé' using errcode = '42501';
  end if;
  select id into v_carrito from public.carritos where usuario_id = uid;
  if v_carrito is null or not exists (select 1 from public.lineas_carrito where carrito_id = v_carrito) then
    raise exception 'Panier vide' using errcode = 'P0001';
  end if;
  select valor::numeric(5, 2) into v_tasa from public.configuracion where clave = 'tasa_iva';
  if v_tasa is null then raise exception 'TVA non configurée' using errcode = 'P0001'; end if;

  insert into public.pedidos (usuario_id, subtotal_ht, tasa_iva, importe_iva, total_ttc, datos_facturacion)
  values (uid, 0, v_tasa, 0, 0, to_jsonb(v_perfil) - 'id' - 'estado' - 'rol' - 'motivo_rechazo')
  returning id into v_pedido;

  for l in select * from public.lineas_carrito where carrito_id = v_carrito loop
    -- precio de la variante (o del producto) con el mayor lote/tramo que no supere la cantidad
    select precio_ht into p from public.precios
      where activo and producto_slug = l.producto_slug and (variante = nullif(l.variante, '') or variante is null) and cantidad_minima <= l.cantidad
      order by (variante is not null) desc, cantidad_minima desc limit 1;
    if p is null then raise exception 'Prix ou lot minimum non respecté pour %', l.producto_slug using errcode = 'P0001'; end if;
    insert into public.lineas_pedido (pedido_id, producto_slug, variante, talla, cantidad, precio_unitario_ht, total_linea_ht, personalizacion)
    values (v_pedido, l.producto_slug, l.variante, l.talla, l.cantidad, p, round(p * l.cantidad, 2), l.personalizacion);
    v_subtotal := v_subtotal + round(p * l.cantidad, 2);
  end loop;

  update public.pedidos set subtotal_ht = v_subtotal, importe_iva = round(v_subtotal * v_tasa / 100, 2),
         total_ttc = v_subtotal + round(v_subtotal * v_tasa / 100, 2) where id = v_pedido;
  delete from public.lineas_carrito where carrito_id = v_carrito;
  return v_pedido;
end
$$;
revoke all on function public.crear_pedido_desde_carrito() from public, anon;
grant execute on function public.crear_pedido_desde_carrito() to authenticated;

-- Tasa de IVA leíble por las cuentas validadas (para enseñar el carrito) sin abrir la tabla de configuración.
create function public.tasa_iva() returns numeric
language sql stable security definer set search_path = public as
$$ select case when public.es_validado() then (select valor::numeric from public.configuracion where clave = 'tasa_iva') end $$;
revoke all on function public.tasa_iva() from public, anon;
grant execute on function public.tasa_iva() to authenticated;

insert into public.configuracion (clave, valor, descripcion)
values ('tasa_iva', '20.00', 'Tipo de IVA aplicado en el carrito y en los pedidos (%). [À CONFIRMER avec La Ola Import]')
on conflict (clave) do nothing;
