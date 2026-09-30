import { useQuery } from "@tanstack/react-query";
import { Check, Gift, Scissors, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function ProgramaFidelidade() {
  const { userId } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["fidelidade", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fidelidade_clientes" as never)
        .select("cortes_realizados,premio_disponivel,atendimentos_concluidos")
        .eq("cliente_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as { cortes_realizados: number; premio_disponivel: boolean; atendimentos_concluidos: number } | null;
    },
  });

  const cortes = data?.cortes_realizados ?? 0;
  const premio = !!data?.premio_disponivel;
  const progresso = premio ? 100 : Math.min(cortes * 10, 100);

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-lg">
      <CardContent className="relative p-6 sm:p-7">
        <div className="absolute right-5 top-5 opacity-10"><Scissors size={90} /></div>
        <div className="relative">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary" size={19} />
            <p className="text-xs font-bold uppercase tracking-[.22em] text-primary">Clube Romario</p>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl">10 CORTES = 1 GRÁTIS</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {premio ? "Você conquistou seu corte grátis!" : `Faltam ${10 - cortes} corte${10 - cortes === 1 ? "" : "s"} para liberar o próximo grátis.`}
              </p>
            </div>
            {premio && <Badge className="gap-1 bg-primary text-primary-foreground"><Gift size={14} /> CORTE GRÁTIS</Badge>}
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Seu progresso</span>
              <strong>{premio ? "10/10" : `${cortes}/10`}</strong>
            </div>
            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: 10 }, (_, i) => {
                const ativo = i < cortes || premio;
                return <div key={i} className={`flex h-9 items-center justify-center rounded-lg border text-xs font-bold transition ${ativo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/60 text-muted-foreground"}`}>
                  {ativo ? <Check size={15} /> : i + 1}
                </div>;
              })}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border/70 bg-background/40 p-3 text-xs leading-5 text-muted-foreground">
            {isLoading ? "Carregando seu histórico..." : premio
              ? "Seu benefício fica reservado automaticamente no próximo agendamento. Depois de concluir o corte grátis, o contador volta para 0/10."
              : "Somente atendimentos concluídos pela barbearia entram na contagem. Cancelamentos e faltas não geram corte."}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
