import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarPlus, CloudOff, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { SeletorEstrelas } from "@/components/Estrelas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { dataLonga, hora, mensagemErro, moeda, STATUS_LABEL, textoSeguro } from "@/lib/barbearia";

export const Route = createFileRoute("/_authenticated/meus-agendamentos")({
  head: () => ({
    meta: [
      { title: "Meus horários — Romario Barber Shop" },
      { name: "description", content: "Veja, cancele ou avalie seus atendimentos na barbearia." },
      { property: "og:title", content: "Meus horários — Romario Barber Shop" },
      { property: "og:description", content: "Veja, cancele ou avalie seus atendimentos." },
    ],
  }),
  component: MeusAgendamentos,
});

const CACHE_PREFIX = "barbearia-meus-agendamentos:";

type Item = {
  id: string;
  inicio: string;
  fim: string;
  status: string;
  preco: number;
  pagamento_status: string;
  observacoes: string | null;
  servicos: { nome: string; duracao_minutos: number } | null;
  barbeiros: { nome: string } | null;
  avaliacoes: { id: string }[];
};

function lerCache(userId: string | undefined): Item[] | undefined {
  if (typeof window === "undefined" || !userId) return undefined;
  try {
    const bruto = localStorage.getItem(CACHE_PREFIX + userId);
    return bruto ? (JSON.parse(bruto) as Item[]) : undefined;
  } catch {
    return undefined;
  }
}

function MeusAgendamentos() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [avaliando, setAvaliando] = useState<Item | null>(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");

  const { data: config } = useQuery({
    queryKey: ["config-publica"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("antecedencia_min_cancelamento_horas")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const consulta = useQuery({
    queryKey: ["meus-agendamentos", userId],
    enabled: !!userId,
    initialData: () => lerCache(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(
          "id, inicio, fim, status, preco, pagamento_status, observacoes, servicos(nome, duracao_minutos), barbeiros(nome), avaliacoes(id)",
        )
        .eq("cliente_id", userId!)
        .order("inicio", { ascending: false });
      if (error) throw error;
      return data as unknown as Item[];
    },
  });

  // Consulta offline básica: guarda a última agenda vista no aparelho.
  useEffect(() => {
    if (consulta.isSuccess && consulta.data && !consulta.isFetching) {
      try {
        if (userId) localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(consulta.data));
      } catch {
        /* armazenamento cheio: segue sem cache */
      }
    }
  }, [consulta.data, consulta.isSuccess, consulta.isFetching]);

  const cancelar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agendamentos").update({ status: "cancelado" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento cancelado");
      queryClient.invalidateQueries();
    },
    onError: (erro) => toast.error("Não foi possível cancelar", { description: mensagemErro(erro) }),
  });

  const avaliar = useMutation({
    mutationFn: async () => {
      if (!avaliando || !userId) return;
      const { data: ag, error: erroAg } = await supabase
        .from("agendamentos")
        .select("barbeiro_id")
        .eq("id", avaliando.id)
        .single();
      if (erroAg) throw erroAg;
      const { error } = await supabase.from("avaliacoes").insert({
        agendamento_id: avaliando.id,
        cliente_id: userId,
        barbeiro_id: ag.barbeiro_id,
        nota,
        comentario: comentario ? textoSeguro(comentario) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Obrigado pela avaliação!");
      setAvaliando(null);
      setComentario("");
      setNota(5);
      queryClient.invalidateQueries();
    },
    onError: (erro) => toast.error("Não foi possível avaliar", { description: mensagemErro(erro) }),
  });

  const itens = consulta.data ?? [];
  const agora = Date.now();
  const futuros = itens.filter((i) => new Date(i.inicio).getTime() >= agora && ["pendente", "confirmado"].includes(i.status));
  const passados = itens.filter((i) => !futuros.includes(i));

  function podeCancelar(item: Item) {
    const horas = (new Date(item.inicio).getTime() - agora) / 3600000;
    return horas >= (config?.antecedencia_min_cancelamento_horas ?? 2);
  }

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl sm:text-4xl">MEUS HORÁRIOS</h1>
          <Button asChild size="sm">
            <Link to="/agendar">
              <CalendarPlus aria-hidden="true" /> Novo horário
            </Link>
          </Button>
        </div>

        {consulta.isError && (
          <p className="mt-3 flex items-center gap-2 rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
            <CloudOff size={16} aria-hidden="true" /> Sem conexão agora — mostrando a última agenda salva no
            aparelho.
          </p>
        )}

        <Tabs defaultValue="futuros" className="mt-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="futuros">Próximos ({futuros.length})</TabsTrigger>
            <TabsTrigger value="historico">Histórico ({passados.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="futuros" className="space-y-3 pt-4">
            {futuros.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Você não tem horários marcados. Que tal agendar seu próximo corte?
                </CardContent>
              </Card>
            )}
            {futuros.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{item.servicos?.nome}</p>
                      <p className="text-sm text-muted-foreground">com {item.barbeiros?.nome}</p>
                    </div>
                    <Badge>{STATUS_LABEL[item.status]}</Badge>
                  </div>
                  <p className="text-sm capitalize">
                    {dataLonga(item.inicio)} · {hora(item.inicio)} às {hora(item.fim)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {moeda(item.preco)} ·{" "}
                    {item.pagamento_status === "pago" ? "Pago" : "A pagar no local"}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/agendar">Remarcar</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!podeCancelar(item) || cancelar.isPending}
                      onClick={() => cancelar.mutate(item.id)}
                    >
                      Cancelar
                    </Button>
                    {!podeCancelar(item) && (
                      <span className="self-center text-xs text-muted-foreground">
                        Cancelamento apenas com {config?.antecedencia_min_cancelamento_horas ?? 2}h de
                        antecedência.
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="historico" className="space-y-3 pt-4">
            {passados.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.servicos?.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        com {item.barbeiros?.nome} · {dataLonga(item.inicio)} · {hora(item.inicio)}
                      </p>
                    </div>
                    <Badge variant="secondary">{STATUS_LABEL[item.status]}</Badge>
                  </div>
                  {item.status === "concluido" && item.avaliacoes.length === 0 && (
                    <Button size="sm" variant="outline" onClick={() => setAvaliando(item)}>
                      <Star aria-hidden="true" /> Avaliar atendimento
                    </Button>
                  )}
                  {item.avaliacoes.length > 0 && (
                    <p className="text-xs text-muted-foreground">Você já avaliou este atendimento.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!avaliando} onOpenChange={(aberto) => !aberto && setAvaliando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como foi o atendimento?</DialogTitle>
          </DialogHeader>
          <SeletorEstrelas valor={nota} onChange={setNota} />
          <Textarea
            maxLength={500}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Conte pra gente (opcional)"
          />
          <DialogFooter>
            <Button onClick={() => avaliar.mutate()} disabled={avaliar.isPending}>
              Enviar avaliação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
