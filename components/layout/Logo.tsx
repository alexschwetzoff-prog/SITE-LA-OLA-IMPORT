// Logo complet (vague + « La Ola Import »), PNG/WebP transparent provisoire en attendant le vectoriel du graphiste.
// Zone de protection : le padding du lien parent. Taille minimale : 120 px de large (lisibilité du script en mobile).
// Version WebP 480 px (2× de l'affichage) : ~35 Ko.

export default function Logo({ className = '', priority = false }: { className?: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- logo transparent déjà optimisé (WebP 480/960), servi tel quel
    <img
      src="/marca/logo-la-ola-import-480.webp"
      srcSet="/marca/logo-la-ola-import-480.webp 480w, /marca/logo-la-ola-import-960.webp 960w"
      sizes="160px"
      width={480}
      height={270}
      alt="La Ola Import"
      className={className}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  );
}
