import { FormularioPerfil } from '@/components/cuenta/Formularios';
import { exigirSesion } from '@/lib/cuenta/sesion';

export default async function PaginaMisDatos({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await exigirSesion('/compte');
  const sp = await searchParams;
  const p = s.perfil;
  return (
    <div className="max-w-3xl">
      {sp['mot-de-passe'] === 'ok' && (
        <p role="status" className="mb-6 rounded-xl bg-[#e8f6ee] px-4 py-3 text-sm font-medium text-[#1c5a37]">
          Votre mot de passe a été modifié.
        </p>
      )}
      <h2 className="font-display text-2xl font-extrabold text-marine">Mes données</h2>
      <p className="mt-1 mb-6 text-ardoise">Les informations de votre entreprise, utilisées pour la facturation.</p>
      <FormularioPerfil
        perfil={{
          razon_social: p.razon_social, siret: p.siret, numero_tva: p.numero_tva ?? '', nombre_contacto: p.nombre_contacto, apellidos_contacto: p.apellidos_contacto,
          telefono: p.telefono ?? '', direccion_facturacion: p.direccion_facturacion, codigo_postal: p.codigo_postal, ciudad: p.ciudad, sector: p.sector ?? '', email: s.email,
        }}
      />
    </div>
  );
}
