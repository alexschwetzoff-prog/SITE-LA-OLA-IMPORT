'use client';

// Archivo original del logo del cliente guardado en el navegador (IndexedDB), para que llegue intacto a /proyecto y
// la fase 6 lo adjunte al enviar. Se guarda al pulsar «Enviar mi diseño» en el estudio (decisión del equipo,
// 12/10/2026). Nada sale del navegador desde aquí.

const BD = 'marca';
const ALMACEN = 'logos';
const VERSION = 1;

export interface LogoGuardado {
  id: string;
  nombre: string;
  tipo: string;
  tamano: number;
  fecha: string;
  archivo: Blob;
}

function abrirVersion(version?: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Este navegador no permite guardar archivos.'));
      return;
    }
    const peticion = version ? indexedDB.open(BD, version) : indexedDB.open(BD);
    peticion.onupgradeneeded = () => {
      const bd = peticion.result;
      if (!bd.objectStoreNames.contains(ALMACEN)) bd.createObjectStore(ALMACEN, { keyPath: 'id' });
    };
    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error ?? new Error('No se ha podido abrir el almacén.'));
    peticion.onblocked = () => reject(new Error('El almacén está bloqueado por otra pestaña.'));
  });
}

/** Abre la base y se asegura de que exista el almacén (si otra versión la creó sin él, sube la versión). */
async function abrir(): Promise<IDBDatabase> {
  let bd = await abrirVersion(VERSION);
  if (!bd.objectStoreNames.contains(ALMACEN)) {
    const siguiente = bd.version + 1;
    bd.close();
    bd = await abrirVersion(siguiente);
  }
  return bd;
}

function operar<T>(modo: IDBTransactionMode, accion: (almacen: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return abrir().then(
    (bd) =>
      new Promise<T>((resolve, reject) => {
        const tx = bd.transaction(ALMACEN, modo);
        const peticion = accion(tx.objectStore(ALMACEN));
        peticion.onsuccess = () => resolve(peticion.result);
        peticion.onerror = () => reject(peticion.error ?? new Error('Error en el almacén.'));
        tx.oncomplete = () => bd.close();
        tx.onabort = () => {
          bd.close();
          reject(tx.error ?? new Error('Operación cancelada.'));
        };
      }),
  );
}

/** Guarda el archivo tal cual. Devuelve false si el navegador no lo permite (modo privado, sin sitio…). */
export async function guardarLogo(id: string, archivo: File): Promise<boolean> {
  try {
    const registro: LogoGuardado = { id, nombre: archivo.name, tipo: archivo.type, tamano: archivo.size, fecha: new Date().toISOString(), archivo };
    await operar('readwrite', (almacen) => almacen.put(registro));
    return true;
  } catch {
    return false;
  }
}

/** Recupera el archivo como File (o null si no está). */
export async function leerLogo(id: string): Promise<File | null> {
  try {
    const registro = await operar<LogoGuardado | undefined>('readonly', (almacen) => almacen.get(id));
    if (!registro) return null;
    return registro.archivo instanceof File ? registro.archivo : new File([registro.archivo], registro.nombre, { type: registro.tipo });
  } catch {
    return null;
  }
}

export async function borrarLogo(id: string): Promise<void> {
  try {
    await operar('readwrite', (almacen) => almacen.delete(id));
  } catch {
    // sin almacén: nada que borrar
  }
}

// Fase 6: el mismo almacén guarda también las capturas grandes (1200 × 1500) de cada diseño, con la fecha del diseño
// como prefijo, para adjuntarlas al enviar el formulario sin depender de sessionStorage.

export type LadoCaptura = 'delante' | 'detras';

export const idCaptura = (fecha: string, lado: LadoCaptura) => `${fecha}:captura-${lado}`;
/** Fase 10: el archivo del logo trasero de un diseño (el delantero va con la fecha a secas, `logoId`). */
export const idLogoDetras = (fecha: string) => `${fecha}:logo-detras`;

/** Cualquier archivo (el logo o una captura). */
export const leerArchivo = leerLogo;

/** Guarda una captura del estudio (data URL PNG) como archivo. Devuelve false si el navegador no lo permite. */
export async function guardarCapturaDataUrl(fecha: string, lado: LadoCaptura, dataUrl: string): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    return await guardarLogo(idCaptura(fecha, lado), new File([blob], `diseno-${lado}.png`, { type: blob.type || 'image/png' }));
  } catch {
    return false;
  }
}

/** Borra los logos y las capturas de un diseño (al quitarlo de la cesta o tras enviar). */
export async function borrarArchivosDiseno(fecha: string, logoId?: string | null, logoIdDetras?: string | null): Promise<void> {
  await Promise.all([
    logoId ? borrarLogo(logoId) : Promise.resolve(),
    logoIdDetras ? borrarLogo(logoIdDetras) : Promise.resolve(),
    borrarLogo(idLogoDetras(fecha)),
    borrarLogo(idCaptura(fecha, 'delante')),
    borrarLogo(idCaptura(fecha, 'detras')),
  ]);
}
