import type { Metadata } from 'next';
import { Apartado, Correo, Falta, PaginaLegal } from '@/components/legal/Legal';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Aviso legal',
  description: 'Aviso legal de dominio-pendiente.example: titular, objeto de la web, estudio de diseño, reseñas, propiedad intelectual y legislación aplicable.',
  alternates: { canonical: '/aviso-legal' },
};

const { titular } = SITE;

export default function AvisoLegal() {
  return (
    <PaginaLegal titulo="Aviso legal">
      <Apartado titulo="Titular">
        La web dominio-pendiente.example es titularidad de la {titular.nombre} (en adelante, [MARCA]), con NIF {titular.nif},
        domicilio en {titular.direccion}, inscrita en el Registro de Asociaciones de la Comunitat Valenciana con el número{' '}
        {titular.registro ? titular.registro : <Falta que="FALTA número de registro" />}, y correo de contacto{' '}
        <Correo email={titular.email} />. [MARCA] es el nombre comercial con el que presta servicios de personalización
        textil y merchandising.
      </Apartado>

      <Apartado titulo="Objeto">
        La web presenta los servicios, el catálogo y los canales de contacto de [MARCA], y permite solicitar presupuestos,
        pedir una visita y crear vistas previas de productos personalizados. En la web no se contrata: el encargo se cierra
        al aceptar el presupuesto. Los precios publicados son orientativos («desde»), por unidad, sin IVA y en las
        condiciones indicadas junto a ellos.
      </Apartado>

      <Apartado titulo="Estudio de diseño">
        Las vistas previas son orientativas: el color, el tamaño y la posición del diseño en el producto final pueden variar
        respecto a lo que se ve en pantalla, y las condiciones definitivas se fijan en el presupuesto. Quien sube un logo o
        un diseño declara que tiene derecho a usarlo y autoriza a [MARCA] a utilizarlo solo para preparar la vista previa,
        el presupuesto y, en su caso, la producción del pedido.
      </Apartado>

      <Apartado titulo="Reseñas">
        Las opiniones publicadas proceden de clientes que han hecho un pedido y han autorizado su publicación. No se edita
        su contenido; solo se retiran las que contienen spam, insultos o datos personales de terceros.
      </Apartado>

      <Apartado titulo="Uso permitido">
        La persona usuaria se compromete a usar la web de forma lícita, diligente y respetuosa, sin dañar sistemas,
        interferir en el funcionamiento del sitio, suplantar identidades ni usar los contenidos con fines ilícitos o
        contrarios a la buena fe.
      </Apartado>

      <Apartado titulo="Propiedad intelectual e industrial">
        Salvo indicación en contrario, los contenidos, textos, diseño, estructura visual, elementos gráficos, marcas,
        logotipos, fotografías, modelos 3D, vídeos, animaciones, código y demás materiales de esta web pertenecen a
        [MARCA] o a sus legítimos titulares. No se permite su reproducción, distribución, transformación o comunicación
        pública sin autorización previa, salvo en los casos permitidos por la ley. Las marcas de terceros que puedan
        aparecer pertenecen a sus titulares.
      </Apartado>

      <Apartado titulo="Enlaces externos">
        La web puede incluir enlaces a sitios de terceros, como redes sociales o mensajería. [MARCA] no controla esos
        sitios ni responde de sus contenidos, políticas, disponibilidad o prácticas de privacidad.
      </Apartado>

      <Apartado titulo="Responsabilidad">
        [MARCA] trabaja para mantener la información actualizada y la web disponible, pero no garantiza la ausencia de
        errores, interrupciones, fallos técnicos o elementos dañinos. La información publicada tiene carácter general y
        puede modificarse, actualizarse o retirarse sin previo aviso.
      </Apartado>

      <Apartado titulo="Legislación aplicable">
        Este aviso legal se rige por la legislación española. Cuando proceda, las partes se someten a los juzgados y
        tribunales competentes conforme a la normativa vigente.
      </Apartado>
    </PaginaLegal>
  );
}
