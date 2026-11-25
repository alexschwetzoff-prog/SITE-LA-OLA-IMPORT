-- Pruebas de las políticas RLS del espacio cliente. Se ejecutan contra la pila local (npm run test:rls) dentro de una
-- transacción que se deshace al final: no deja datos. Cada comprobación imprime OK o aborta con FALLO.
begin;

create or replace function pg_temp.como(uid uuid) returns void language plpgsql as
$$ begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uid::text, true);
  execute 'set local role authenticated';
end $$;
create or replace function pg_temp.como_anon() returns void language plpgsql as
$$ begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role anon';
end $$;
create or replace function pg_temp.espera_error(consulta text, etiqueta text) returns void language plpgsql as
$$ begin
  begin execute consulta; exception when others then raise notice 'OK: % (bloqueado: %)', etiqueta, sqlerrm; return; end;
  raise exception 'FALLO: % debería estar bloqueado', etiqueta;
end $$;
create or replace function pg_temp.cuenta(consulta text) returns bigint language plpgsql as
$$ declare n bigint; begin execute 'select count(*) from (' || consulta || ') q' into n; return n; end $$;
grant execute on all functions in schema pg_temp to public;

do $$
declare
  a uuid := '11111111-1111-1111-1111-111111111111';  -- cliente validado A
  b uuid := '22222222-2222-2222-2222-222222222222';  -- cliente validado B
  c uuid := '33333333-3333-3333-3333-333333333333';  -- cliente pendiente
  d uuid := '44444444-4444-4444-4444-444444444444';  -- admin
  ped uuid; n bigint; est text;
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (a, 'authenticated', 'authenticated', 'a@test.fr', '{"razon_social":"A SARL","siret":"73282932000074"}'),
    (b, 'authenticated', 'authenticated', 'b@test.fr', '{"razon_social":"B SARL","siret":"73282932000074"}'),
    (c, 'authenticated', 'authenticated', 'c@test.fr', '{"razon_social":"C SARL","siret":"73282932000074"}'),
    (d, 'authenticated', 'authenticated', 'd@test.fr', '{"razon_social":"Admin"}');
  update public.perfiles set estado = 'validada' where id in (a, b);
  update public.perfiles set estado = 'validada', rol = 'admin' where id = d;
  delete from public.precios;  -- el test parte de una tabla vacía (todo se deshace con el rollback final)
  insert into public.precios (producto_slug, variante, cantidad_minima, precio_ht) values ('prod-x', null, 6, 10.00), ('prod-x', 'Rouge', 12, 8.50);
  update public.configuracion set valor = '20.00' where clave = 'tasa_iva';

  -- 1. perfiles: cada uno ve solo el suyo; el admin ve todos
  perform pg_temp.como(a);
  if pg_temp.cuenta('select 1 from public.perfiles') <> 1 then raise exception 'FALLO: A ve perfiles ajenos'; end if;
  raise notice 'OK: un cliente solo lee su perfil';
  reset role; select count(*) into n from public.perfiles; perform pg_temp.como(d);
  if pg_temp.cuenta('select 1 from public.perfiles') <> n then raise exception 'FALLO: el admin no ve todos los perfiles'; end if;
  raise notice 'OK: el admin lee todos los perfiles';

  -- 2. un cliente no puede validarse a sí mismo ni hacerse admin
  reset role; perform pg_temp.como(c);
  update public.perfiles set estado = 'validada', rol = 'admin' where id = c;
  reset role;
  select estado into est from public.perfiles where id = c;
  if est <> 'pendiente' or (select rol from public.perfiles where id = c) <> 'cliente' then raise exception 'FALLO: C se auto-validó'; end if;
  raise notice 'OK: un cliente no puede cambiar su estado ni su rol';
  -- ...pero sí sus datos
  perform pg_temp.como(c); update public.perfiles set telefono = '0600000000' where id = c; reset role;
  if (select telefono from public.perfiles where id = c) <> '0600000000' then raise exception 'FALLO: C no puede editar su teléfono'; end if;
  raise notice 'OK: un cliente edita sus datos de contacto';
  -- el admin sí valida
  perform pg_temp.como(d); update public.perfiles set estado = 'validada' where id = c; reset role;
  if (select estado from public.perfiles where id = c) <> 'validada' or (select validado_en from public.perfiles where id = c) is null then raise exception 'FALLO: el admin no validó'; end if;
  update public.perfiles set estado = 'pendiente' where id = c; -- se deja pendiente para las pruebas siguientes
  raise notice 'OK: el admin valida cuentas';

  -- 3. precios: pendiente y anónimo no los leen; validados sí; solo el admin escribe
  perform pg_temp.como(c);
  if pg_temp.cuenta('select 1 from public.precios') <> 0 then raise exception 'FALLO: una cuenta pendiente lee precios'; end if;
  raise notice 'OK: una cuenta no validada NO lee precios';
  reset role; perform pg_temp.como(a);
  if pg_temp.cuenta('select 1 from public.precios') <> 2 then raise exception 'FALLO: una cuenta validada no lee precios'; end if;
  raise notice 'OK: una cuenta validada lee precios';
  perform pg_temp.espera_error($q$insert into public.precios (producto_slug, precio_ht) values ('x', 1)$q$, 'un cliente no puede insertar precios');
  update public.precios set precio_ht = 0;  -- RLS: 0 filas afectadas sin error
  reset role;
  if (select min(precio_ht) from public.precios) = 0 then raise exception 'FALLO: un cliente cambió precios'; end if;
  perform pg_temp.como_anon();
  perform pg_temp.espera_error('select * from public.precios', 'un visitante no lee la tabla de precios');
  reset role; perform pg_temp.como(d);
  insert into public.precios (producto_slug, precio_ht) values ('prod-y', 5);
  raise notice 'OK: el admin escribe precios';
  reset role;

  -- 4. favoritos
  perform pg_temp.como(b); insert into public.favoritos (producto_slug, variante) values ('prod-x', 'Rouge'); reset role;
  perform pg_temp.como(a);
  if pg_temp.cuenta('select 1 from public.favoritos') <> 0 then raise exception 'FALLO: A ve favoritos de B'; end if;
  perform pg_temp.espera_error($q$insert into public.favoritos (usuario_id, producto_slug) values ('22222222-2222-2222-2222-222222222222', 'otro')$q$, 'A no puede crear favoritos a nombre de B');
  delete from public.favoritos; reset role;
  if (select count(*) from public.favoritos where usuario_id = b) <> 1 then raise exception 'FALLO: A borró favoritos de B'; end if;
  raise notice 'OK: favoritos aislados por cliente';
  perform pg_temp.como(c);
  perform pg_temp.espera_error($q$insert into public.favoritos (producto_slug) values ('prod-x')$q$, 'una cuenta pendiente no guarda favoritos en la base');
  reset role;

  -- 5. carrito + pedido
  perform pg_temp.como(c);
  perform pg_temp.espera_error($q$insert into public.carritos default values$q$, 'una cuenta pendiente no tiene carrito');
  reset role; perform pg_temp.como(a);
  insert into public.carritos default values;
  insert into public.lineas_carrito (carrito_id, producto_slug, variante, cantidad) select id, 'prod-x', 'Rouge', 12 from public.carritos;
  reset role; perform pg_temp.como(b);
  if pg_temp.cuenta('select 1 from public.lineas_carrito') <> 0 then raise exception 'FALLO: B ve el carrito de A'; end if;
  raise notice 'OK: carritos aislados por cliente';
  reset role; perform pg_temp.como(a);
  perform pg_temp.espera_error($q$insert into public.pedidos (usuario_id, subtotal_ht, tasa_iva, importe_iva, total_ttc, datos_facturacion) values ('11111111-1111-1111-1111-111111111111', 0, 0, 0, 0, '{}')$q$, 'un cliente no inserta pedidos a mano');
  ped := public.crear_pedido_desde_carrito();
  select subtotal_ht into n from public.pedidos where id = ped;
  if n <> 102.00 or (select total_ttc from public.pedidos where id = ped) <> 122.40 then raise exception 'FALLO: importes del pedido (% / %)', n, (select total_ttc from public.pedidos where id = ped); end if;
  if (select estado from public.pedidos where id = ped) <> 'pendiente_pago' then raise exception 'FALLO: estado del pedido'; end if;
  if pg_temp.cuenta('select 1 from public.lineas_carrito') <> 0 then raise exception 'FALLO: el carrito no se vació'; end if;
  raise notice 'OK: el pedido se crea desde el carrito y la tabla de precios (12 × 8,50 = 102,00 HT; 122,40 TTC)';
  reset role; perform pg_temp.como(b);
  if pg_temp.cuenta('select 1 from public.pedidos') <> 0 or pg_temp.cuenta('select 1 from public.lineas_pedido') <> 0 then raise exception 'FALLO: B ve pedidos de A'; end if;
  raise notice 'OK: pedidos aislados por cliente';
  reset role; perform pg_temp.como(a);
  update public.pedidos set estado = 'pagado' where id = ped; reset role;
  if (select estado from public.pedidos where id = ped) <> 'pendiente_pago' then raise exception 'FALLO: un cliente cambió el estado de su pedido'; end if;
  raise notice 'OK: un cliente no cambia el estado del pedido';
  perform pg_temp.como(d); update public.pedidos set estado = 'pagado' where id = ped; reset role;
  if (select estado from public.pedidos where id = ped) <> 'pagado' then raise exception 'FALLO: el admin no cambió el estado'; end if;
  raise notice 'OK: el admin cambia el estado del pedido';

  -- 6. lote mínimo: por debajo del lote no se puede pedir
  perform pg_temp.como(a);
  insert into public.carritos default values on conflict (usuario_id) do nothing;
  insert into public.lineas_carrito (carrito_id, producto_slug, variante, cantidad) select id, 'prod-x', '', 3 from public.carritos where usuario_id = a;
  perform pg_temp.espera_error('select public.crear_pedido_desde_carrito()', 'no se puede pedir por debajo del lote mínimo');
  reset role;
  raise notice 'TODAS LAS COMPROBACIONES RLS: OK';
end $$;

rollback;
