import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/** Gera uma URL temporária assinada para uma foto guardada no armazenamento privado. */
export function useFotoUrl(caminho: string | null | undefined) {
  return useQuery({
    queryKey: ["foto", caminho],
    enabled: !!caminho,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("fotos").createSignedUrl(caminho!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export function Foto({
  caminho,
  nome,
  className,
}: {
  caminho: string | null | undefined;
  nome: string;
  className?: string;
}) {
  const { data: url } = useFotoUrl(caminho);
  const iniciais = nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-display text-lg text-accent-foreground",
        className,
      )}
      aria-hidden={!!url}
    >
      {url ? (
        <img src={url} alt={`Foto de ${nome}`} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        iniciais
      )}
    </span>
  );
}
