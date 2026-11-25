import type { ComponentProps } from 'react';

interface Props extends Omit<ComponentProps<'input'>, 'name'> {
  nombre: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  valor?: string;
  ancho?: boolean;
}

/** Campo de formulario accesible: etiqueta enlazada, error y ayuda asociados con aria-describedby. */
export function Campo({ nombre, etiqueta, error, ayuda, valor, ancho, className = '', ...resto }: Props) {
  const id = `campo-${nombre}`;
  const desc = [error ? `${id}-error` : null, ayuda ? `${id}-ayuda` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={ancho ? 'sm:col-span-2' : ''}>
      <label htmlFor={id} className="block text-sm font-medium text-encre">
        {etiqueta}
        {resto.required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        name={nombre}
        defaultValue={valor}
        aria-invalid={error ? true : undefined}
        aria-describedby={desc}
        className={`mt-1 min-h-11 w-full rounded-xl border bg-white px-3 text-base text-marine focus-visible:ring-2 focus-visible:ring-bleu-600 ${error ? 'border-[#9a2f2f]' : 'border-marine/20'} ${className}`}
        {...resto}
      />
      {ayuda && (
        <p id={`${id}-ayuda`} className="mt-1 text-xs text-ardoise">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-medium text-[#9a2f2f]">
          {error}
        </p>
      )}
    </div>
  );
}

export function CasillaLegal({ nombre, error, marcada, children }: { nombre: string; error?: string; marcada?: boolean; children: React.ReactNode }) {
  const id = `campo-${nombre}`;
  return (
    <div className="sm:col-span-2">
      <label htmlFor={id} className="flex items-start gap-3 text-sm text-marine">
        <input id={id} name={nombre} type="checkbox" defaultChecked={marcada} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className="mt-1 h-5 w-5 shrink-0 rounded border-marine/40 accent-fuchsia-700" />
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-medium text-[#9a2f2f]">
          {error}
        </p>
      )}
    </div>
  );
}
