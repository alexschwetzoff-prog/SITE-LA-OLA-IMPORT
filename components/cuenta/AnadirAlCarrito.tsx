'use client';

// «Ajouter au panier» de la ficha (sustituye a «Añadir al presupuesto»): variante elegida, talla si la hay y cantidad
// (respeta el lote mínimo cuando los precios son visibles). Sin sesión o con la cuenta en revisión abre el aviso de conexión
// y guarda la selección para recuperarla después del inicio de sesión.
import { useId, useState } from 'react';
import Link from 'next/link';
import type { Color, Producto } from '@/data/catalogo';
import { Boton } from '@/components/ui/Botones';
import { loteMinimo } from '@/lib/carrito/calculo';
import { useCuenta } from './almacen';

export interface PosicionElegida {
  posicion: string;
  nombre: string;
}

interface Props {
  producto: Pick<Producto, 'slug' | 'nombre' | 'tipo' | 'tallas' | 'tallasInfantiles'>;
  color: Color;
  /** Emplazamientos elegidos en la ficha: obligatorios si el producto los pide. */
  posiciones?: PosicionElegida[];
  requierePosicion?: boolean;
  idPosiciones?: string;
  /** Referencia del logo del estudio (IndexedDB) cuando el diseño viene del estudio. */
  logoRef?: string;
  idBoton?: string;
}

export default function AnadirAlCarrito({ producto, color, posiciones = [], requierePosicion = false, idPosiciones, logoRef, idBoton }: Props) {
  const id = useId();
  const estado = useCuenta((s) => s.estado);
  const precios = useCuenta((s) => s.precios);
  const anadir = useCuenta((s) => s.anadir);
  const lineas = useCuenta((s) => s.lineasCarrito);
  const tallas = [...(producto.tallas ?? []), ...(producto.tallasInfantiles ?? [])];
  const minimo = estado === 'validada' ? loteMinimo(precios, producto.slug, color.nombre) : 1;
  const [cantidadElegida, setCantidad] = useState<number | null>(null);
  const cantidad = cantidadElegida ?? minimo;
  const [talla, setTalla] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'ok'; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const enviar = async () => {
    setMensaje(null);
    if (requierePosicion && !posiciones.length) {
      setMensaje({ tipo: 'error', texto: 'Choisissez d’abord l’emplacement du marquage.' });
      if (idPosiciones) document.getElementById(idPosiciones)?.focus();
      return;
    }
    if (tallas.length && !talla) {
      setMensaje({ tipo: 'error', texto: 'Choisissez une taille.' });
      return;
    }
    if (!Number.isInteger(cantidad) || cantidad < Math.max(1, minimo)) {
      setMensaje({ tipo: 'error', texto: `Quantité : au moins ${Math.max(1, minimo)}${minimo > 1 ? ' (lot minimum)' : ''}.` });
      return;
    }
    setOcupado(true);
    const r = await anadir({
      slug: producto.slug,
      nombre: producto.nombre,
      variante: color.nombre,
      talla,
      cantidad,
      personalizacion: posiciones.length || logoRef ? { posiciones: posiciones.map((p) => p.nombre), ...(logoRef ? { logo_ref: logoRef } : {}) } : null,
    });
    setOcupado(false);
    if (r.ok) setMensaje({ tipo: 'ok', texto: `${producto.nombre} (${color.nombre.toLowerCase()}) ajouté au panier.` });
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        {tallas.length > 0 && (
          <div>
            <label htmlFor={`${id}-talla`} className="block text-sm font-medium text-encre">
              Taille
            </label>
            <select id={`${id}-talla`} value={talla} onChange={(e) => setTalla(e.target.value)} className="mt-1 min-h-11 rounded-xl border border-marine/20 bg-white px-3 text-sm text-marine">
              <option value="">Choisir…</option>
              {tallas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor={`${id}-cantidad`} className="block text-sm font-medium text-encre">
            Quantité
          </label>
          <input
            id={`${id}-cantidad`}
            type="number"
            inputMode="numeric"
            min={Math.max(1, minimo)}
            max={100000}
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            aria-describedby={minimo > 1 ? `${id}-lote` : undefined}
            className="mt-1 min-h-11 w-28 rounded-xl border border-marine/20 bg-white px-3 text-sm text-marine"
          />
        </div>
      </div>
      {minimo > 1 && (
        <p id={`${id}-lote`} className="mt-1 text-xs text-ardoise">
          Lot minimum : {minimo}.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Boton id={idBoton} variante="principal" tamano="grande" onClick={enviar} disabled={ocupado} aria-describedby={`${id}-estado`} className="min-h-12">
          Ajouter au panier
        </Boton>
        {estado === 'validada' && lineas > 0 && (
          <Link href="/compte/panier" className="text-sm font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
            Voir mon panier ({lineas})
          </Link>
        )}
      </div>
      <p id={`${id}-estado`} role="status" aria-live="polite" className={`mt-2 min-h-5 text-sm ${mensaje?.tipo === 'error' ? 'font-medium text-[#9a2f2f]' : 'text-marine'}`}>
        {mensaje?.texto}
      </p>
    </div>
  );
}
