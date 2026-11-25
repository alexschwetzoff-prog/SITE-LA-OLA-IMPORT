'use client';

// Aviso global: una acción que exige cuenta validada (añadir al carrito, ver precios) sin sesión o con la cuenta en revisión.
// Lo que el usuario estaba eligiendo se guarda y se recupera tras iniciar sesión (components/cuenta/almacen.ts).
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCuenta } from './almacen';

export default function AvisoConexion() {
  const aviso = useCuenta((s) => s.aviso);
  const estado = useCuenta((s) => s.estado);
  const cerrar = useCuenta((s) => s.cerrarAviso);
  const avisoCarrito = useCuenta((s) => s.avisoCarrito);
  const limpiar = useCuenta((s) => s.limpiarAvisoCarrito);
  const ruta = usePathname();
  const boton = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!aviso) return;
    boton.current?.focus();
    const alTeclado = (e: KeyboardEvent) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', alTeclado);
    return () => window.removeEventListener('keydown', alTeclado);
  }, [aviso, cerrar]);

  const siguiente = encodeURIComponent(ruta || '/');
  return (
    <>
      {aviso && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-marine/50 p-4 sm:items-center" onClick={cerrar}>
          <div role="dialog" aria-modal="true" aria-labelledby="aviso-titulo" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-carte-survol" onClick={(e) => e.stopPropagation()}>
            {estado === 'pendiente' ? (
              <>
                <h2 id="aviso-titulo" className="font-display text-xl font-extrabold text-marine">Votre compte est en cours de validation</h2>
                <p className="mt-2 text-sm text-ardoise">
                  Les prix, les favoris enregistrés et le panier sont réservés aux comptes professionnels validés. Nous vérifions votre inscription : ce que vous
                  avez choisi est gardé sur cet appareil et sera ajouté à votre panier dès la validation.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link ref={boton} href="/compte" onClick={cerrar} className="inline-flex min-h-11 items-center rounded-full bg-fuchsia-700 px-5 text-sm font-semibold text-white hover:bg-fuchsia-800">
                    Voir mon compte
                  </Link>
                  <button type="button" onClick={cerrar} className="inline-flex min-h-11 items-center rounded-full border-2 border-marine/80 px-5 text-sm font-semibold text-marine hover:bg-marine/5">
                    Fermer
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="aviso-titulo" className="font-display text-xl font-extrabold text-marine">Connectez-vous pour continuer</h2>
                <p className="mt-2 text-sm text-ardoise">
                  Les prix, les favoris et le panier sont réservés aux professionnels. Connectez-vous ou créez un compte professionnel : ce que vous avez choisi est
                  gardé et vous le retrouverez après la connexion.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link ref={boton} href={`/connexion?siguiente=${siguiente}`} onClick={cerrar} className="inline-flex min-h-11 items-center rounded-full bg-fuchsia-700 px-5 text-sm font-semibold text-white hover:bg-fuchsia-800">
                    Se connecter
                  </Link>
                  <Link href={`/inscription?siguiente=${siguiente}`} onClick={cerrar} className="inline-flex min-h-11 items-center rounded-full border-2 border-violet-600 px-5 text-sm font-semibold text-violet-600 hover:bg-violet-600/8">
                    Créer un compte professionnel
                  </Link>
                </div>
                <button type="button" onClick={cerrar} className="mt-4 text-sm font-medium text-ardoise underline underline-offset-4 hover:text-marine">
                  Plus tard
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {avisoCarrito && (
        <div role="status" aria-live="polite" className="fixed right-4 bottom-4 z-[60] flex max-w-sm items-start gap-3 rounded-2xl bg-marine p-4 text-sm text-white shadow-carte-survol">
          <p>
            « {avisoCarrito} » a été ajouté à votre panier.{' '}
            <Link href="/compte/panier" onClick={limpiar} className="font-semibold underline underline-offset-4">
              Voir mon panier
            </Link>
          </p>
          <button type="button" onClick={limpiar} aria-label="Fermer" className="shrink-0 rounded-full px-2 text-lg leading-none text-white/80 hover:text-white">
            ×
          </button>
        </div>
      )}
    </>
  );
}
