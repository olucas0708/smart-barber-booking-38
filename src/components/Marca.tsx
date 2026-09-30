import { Link } from "@tanstack/react-router";

export function Marca({ compacto = false }: { compacto?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="Romario Barber Shop, página inicial">
      <img src="/icon-192.png" alt="" width={34} height={34} className="h-8.5 w-8.5 rounded-lg object-cover ring-1 ring-primary/30" />
      {!compacto && (
        <span className="font-display text-xl leading-none tracking-[0.08em]">
          ROMARIO <span className="text-primary">BARBER SHOP</span>
        </span>
      )}
    </Link>
  );
}
