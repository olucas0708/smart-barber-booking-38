import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Estrelas({ nota, tamanho = 14 }: { nota: number; tamanho?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Nota ${nota.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          size={tamanho}
          className={cn(i <= Math.round(nota) ? "fill-primary text-primary" : "text-muted-foreground")}
        />
      ))}
    </span>
  );
}

export function SeletorEstrelas({
  valor,
  onChange,
}: {
  valor: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Nota do atendimento">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={valor === i}
          aria-label={`${i} estrela${i > 1 ? "s" : ""}`}
          onClick={() => onChange(i)}
          className="rounded p-1"
        >
          <Star
            aria-hidden="true"
            size={26}
            className={cn(i <= valor ? "fill-primary text-primary" : "text-muted-foreground")}
          />
        </button>
      ))}
    </div>
  );
}
