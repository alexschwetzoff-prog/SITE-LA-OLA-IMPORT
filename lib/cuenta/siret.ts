// Validación del SIRET (14 cifras) con la fórmula de Luhn. Módulo puro (sin dependencias) para usarlo en el navegador y en el servidor.

/** Quita espacios, puntos y guiones: «732 829 320 00074» → «73282932000074». */
export function normalizarSiret(valor: string): string {
  return valor.replace(/[\s.\-]/g, '');
}

function luhn(cifras: string): boolean {
  let suma = 0;
  for (let i = 0; i < cifras.length; i++) {
    let d = Number(cifras[cifras.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
  }
  return suma % 10 === 0;
}

/**
 * ¿Es un SIRET válido? 14 cifras y suma de Luhn múltiplo de 10. Excepción conocida: los establecimientos de La Poste
 * (SIREN 356 000 000) no cumplen Luhn, pero su suma de cifras es múltiplo de 5.
 */
export function esSiretValido(valor: string): boolean {
  const s = normalizarSiret(valor);
  if (!/^\d{14}$/.test(s)) return false;
  if (s.startsWith('356000000')) return [...s].reduce((a, c) => a + Number(c), 0) % 5 === 0;
  return luhn(s);
}

/** Formato de lectura: «732 829 320 00074». */
export function formatearSiret(valor: string): string {
  const s = normalizarSiret(valor);
  return s.length === 14 ? `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 9)} ${s.slice(9)}` : s;
}
