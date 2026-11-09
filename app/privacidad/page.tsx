import type { Metadata } from 'next';
import { Apartado, Correo, Falta, Lista, PaginaLegal } from '@/components/legal/Legal';
import { configuracionCorreo } from '@/lib/correo/transporte';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Qué datos tratamos en dominio-pendiente.example, para qué, con qué base jurídica, cuánto tiempo y qué derechos tienes.',
  alternates: { canonical: '/privacidad' },
};

const { titular } = SITE;

const finalidades = [
  ['Responder tu solicitud, preparar el presupuesto y organizar la visita', 'Medidas precontractuales a petición tuya'],
  ['Gestionar el pedido y la relación comercial', 'Ejecución del contrato y obligaciones legales (facturación)'],
  ['Pedirte tu opinión tras la entrega', 'Interés legítimo en mejorar el servicio'],
  ['Publicar tu opinión con el nombre de tu negocio', 'Tu consentimiento, que puedes retirar cuando quieras'],
  ['Seguridad de la web y estadísticas agregadas', 'Interés legítimo'],
];

export default function Privacidad() {
  // Fase 9: Resend solo aparece como encargado cuando el envío de emails sale por Resend (CORREO_TRANSPORTE=resend),
  // así el texto legal se actualiza en el mismo despliegue que activa el servicio, sin tocar código.
  const conResend = configuracionCorreo().transporte === 'resend';
  return (
    <PaginaLegal titulo="Política de privacidad">
      <Apartado titulo="Responsable">
        {titular.nombre} ([MARCA]), NIF {titular.nif}, {titular.direccion}. Contacto: <Correo email={titular.email} />.
      </Apartado>

      <p>
        <strong className="font-semibold">Qué datos tratamos.</strong>
      </p>
      <Lista>
        <li>
          Formulario <em>Cuéntanos tu proyecto</em> y petición de visita: tipo de cliente (negocio o particular), nombre,
          negocio y sector (si es para un negocio), la ocasión (si es para ti), ciudad, email, teléfono, preferencias de
          contacto y de visita, productos, cantidades, fechas, mensaje y los archivos o diseños que subas.
        </li>
        <li>Estudio de diseño: tu logo se procesa en tu navegador y solo nos llega si envías el diseño.</li>
        <li>
          Formulario de opinión: valoración, texto, nombre, cargo, negocio, sector, ciudad, producto y, si los aportas, foto
          del pedido y logo.
        </li>
        <li>
          Datos técnicos mínimos de navegación (IP, dispositivo, navegador, fecha y hora) por seguridad y funcionamiento, y
          estadísticas de visitas agregadas, sin cookies.
        </li>
      </Lista>

      <p>
        <strong className="font-semibold">Finalidades y base jurídica.</strong>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-moon-50/20 text-left text-moon-50">
              <th scope="col" className="py-2 pr-4 font-semibold">
                Finalidad
              </th>
              <th scope="col" className="py-2 font-semibold">
                Base jurídica
              </th>
            </tr>
          </thead>
          <tbody>
            {finalidades.map(([finalidad, base]) => (
              <tr key={finalidad} className="border-b border-moon-50/10 align-top">
                <td className="py-2 pr-4">{finalidad}</td>
                <td className="py-2">{base}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Apartado titulo="Conservación">
        Solicitudes que no terminan en pedido: 12 meses, archivos incluidos, y después se eliminan{' '}
        <Falta que="plazo a confirmar" />. Clientes: mientras dure la relación y, después, bloqueados durante los plazos
        legales fiscales y mercantiles. Opiniones publicadas: hasta que retires tu consentimiento.
      </Apartado>

      <Apartado titulo="Destinatarios y encargados">
        No vendemos datos personales. Acceden a ellos, como encargados del tratamiento, los proveedores que hacen funcionar
        la web y el contacto: Netlify (alojamiento de la web){conResend ? ', Resend (envío de los emails de la web)' : ''} y
        Google (correo electrónico: las solicitudes del formulario y los archivos que adjuntas se reciben y se guardan en
        nuestro buzón de Gmail, y desde él te respondemos). También se comunican a autoridades públicas cuando existe
        obligación legal.
      </Apartado>

      <Apartado titulo="Transferencias internacionales">
        Algunos de estos proveedores tienen sede en Estados Unidos. En esos casos se aplican las garantías previstas por la
        normativa: decisión de adecuación (incluido el Marco de Privacidad de Datos UE-EE. UU. cuando el proveedor esté
        adherido) o cláusulas contractuales tipo.
      </Apartado>

      <Apartado titulo="Derechos">
        Puedes solicitar el acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de tus
        datos escribiendo a <Correo email={titular.email} />, y retirar el consentimiento cuando el tratamiento se base en
        él. Si consideras que tus derechos no han sido atendidos, puedes reclamar ante la Agencia Española de Protección de
        Datos.
      </Apartado>

      <Apartado titulo="Menores de edad">
        Esta web no está dirigida a recoger datos de menores de 14 años sin autorización de sus representantes legales. Si
        detectamos que hemos recibido datos de un menor sin esa autorización, los eliminaremos.
      </Apartado>

      <Apartado titulo="Actualizaciones">
        Esta política puede actualizarse por cambios legales, técnicos u organizativos. La versión vigente es siempre la
        publicada en esta página.
      </Apartado>
    </PaginaLegal>
  );
}
