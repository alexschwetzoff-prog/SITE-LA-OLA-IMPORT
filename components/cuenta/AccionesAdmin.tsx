'use client';

import { useState, useTransition } from 'react';
import { Boton } from '@/components/ui/Botones';
import { rechazarCuenta, validarCuenta } from '@/lib/cuenta/acciones-admin';

/** Botones Validar / Rechazar de una cuenta (con motivo opcional al rechazar). */
export default function AccionesAdmin({ id, estado }: { id: string; estado: string }) {
  const [pendiente, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  return (
    <div className="mt-3 flex flex-wrap items-end gap-3">
      {estado !== 'validada' && (
        <Boton variante="principal" disabled={pendiente} onClick={() => empezar(async () => { const r = await validarCuenta({ id }); setMensaje(r.ok ? null : (r.mensaje ?? 'Erreur')); })}>
          Valider
        </Boton>
      )}
      {estado !== 'rechazada' && (
        <>
          <label className="text-sm text-marine">
            <span className="sr-only">Motif du rejet</span>
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motif (facultatif)" className="min-h-11 w-56 rounded-xl border border-marine/20 bg-white px-3 text-sm" />
          </label>
          <Boton variante="claro" disabled={pendiente} onClick={() => empezar(async () => { const r = await rechazarCuenta({ id, motivo }); setMensaje(r.ok ? null : (r.mensaje ?? 'Erreur')); })}>
            Rejeter
          </Boton>
        </>
      )}
      {mensaje && (
        <p role="alert" className="text-sm font-medium text-[#9a2f2f]">
          {mensaje}
        </p>
      )}
    </div>
  );
}
