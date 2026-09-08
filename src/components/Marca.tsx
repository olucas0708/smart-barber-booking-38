import { Link } from "@tanstack/react-router";

export function Marca({ compacto = false }: { compacto?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Navalha & Ouro, página inicial">
      <img src="/icon-192.png" alt="" width={32} height={32} className="h-8 w-8 rounded-md" />
      {!compacto && (
        <span className="font-display text-xl leading-none tracking-wide">
          NAVALHA <span className="text-primary">&</span> OURO
        </span>
      )}
    </Link>
  );
}
