'use client';

import { useEffect } from 'react';
import { useCuenta } from './almacen';

/** Carga el estado de la cuenta una vez, al hidratar (sin tocar el HTML estático de las páginas). */
export default function IniciadorCuenta() {
  const cargar = useCuenta((s) => s.cargar);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  return null;
}
