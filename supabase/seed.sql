-- Semilla (supabase db reset / supabase start). SIN precios: la tabla `precios` se llena cuando La Ola Import los confirme
-- (docs/ESPACIO-CLIENTE.md, «Cargar precios»). Los productos sin precio salen con «Prix sur demande».
insert into public.configuracion (clave, valor, descripcion)
values ('tasa_iva', '20.00', 'Tipo de IVA aplicado en el carrito y en los pedidos (%). [À CONFIRMER avec La Ola Import]')
on conflict (clave) do nothing;
