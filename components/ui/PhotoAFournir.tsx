// Emplacement visible pour une photo ou une vidéo RÉELLE qui n'a pas encore été fournie par La Ola Import.
// scripts/revisar-web.mjs bloque la mise en ligne tant qu'il en reste un.

interface Props {
  /** Ce que la photo doit montrer, ex. « Arthur devant la machine DTF ». */
  sujet: string;
  /** Dimensions recommandées, ex. « 800 × 1000 ». */
  dimensions: string;
  /** Ratio CSS, ex. « 4 / 5 ». */
  ratio?: string;
  type?: 'photo' | 'vidéo';
  className?: string;
}

export default function PhotoAFournir({ sujet, dimensions, ratio = '4 / 3', type = 'photo', className = '' }: Props) {
  return (
    <div
      role="img"
      aria-label={`${type === 'photo' ? 'Photo' : 'Vidéo'} à fournir : ${sujet}`}
      style={{ aspectRatio: ratio }}
      className={`flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-marine/20 bg-perle p-4 text-center ${className}`}
    >
      <span className="font-mono text-xs font-semibold text-ardoise">[{type} à fournir]</span>
      <span className="text-sm text-marine">{sujet}</span>
      <span className="font-mono text-xs text-ardoise">{dimensions}</span>
    </div>
  );
}
