import { useEffect, useMemo, useState } from "react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, Clock, Gift, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Foto } from "@/components/Foto";
import { Estrelas } from "@/components/Estrelas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  buscarHorariosDisponiveis,
  dataLonga,
  hora,
  isoData,
  mensagemErro,
  moeda,
  proximosDias,
  textoSeguro,
} from "@/lib/barbearia";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar horário — Romario Barber Shop" },
      { name: "description", content: "Escolha serviço, barbeiro e horário disponível em tempo real." },
      { property: "og:title", content: "Agendar horário — Romario Barber Shop" },
      { property: "og:description", content: "Escolha serviço, barbeiro e horário em poucos toques." },
    ],
  }),
  component: Agendar,
});

const PASSOS = ["Serviço", "Barbeiro", "Horário", "Confirmar"];

function Agendar() {
  const { userId, perfil } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [passo, setPasso] = useState(0);
  const [servicoId, setServicoId] = useState<string | null>(null);
  const [barbeiroId, setBarbeiroId] = useState<string | null>(null);
  const [dia, setDia] = useState<string>(() => isoData(new Date()));
  const [slot, setSlot] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");

  const { data: fidelidade } = useQuery({
    queryKey: ["fidelidade", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fidelidade_clientes" as never)
        .select("cortes_realizados,premio_disponivel")
        .eq("cliente_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as { cortes_realizados: number; premio_disponivel: boolean } | null;
    },
  });

  const { data: servicos } = useQuery({
    queryKey: ["servicos-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome, descricao, duracao_minutos, preco, categoria")
        .eq("ativo", true)
        .order("preco");
      if (error) throw error;
      return data;
    },
  });

  const { data: barbeiros } = useQuery({
    queryKey: ["equipe-publica"],
    queryFn: async () => {
      const [{ data: lista, error }, { data: avaliacoes }] = await Promise.all([
        supabase.from("barbeiros").select("id, nome, foto_url, especialidades").eq("ativo", true).order("nome"),
        supabase.from("avaliacoes").select("barbeiro_id, nota"),
      ]);
      if (error) throw error;
      return (lista ?? []).map((b) => {
        const notas = (avaliacoes ?? []).filter((a) => a.barbeiro_id === b.id).map((a) => a.nota);
        return {
          ...b,
          media: notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null,
          total: notas.length,
        };
      });
    },
  });

  const servico = useMemo(() => servicos?.find((s) => s.id === servicoId), [servicos, servicoId]);
  const barbeiro = useMemo(() => barbeiros?.find((b) => b.id === barbeiroId), [barbeiros, barbeiroId]);

  const {
    data: slots,
    isFetching: buscandoSlots,
    refetch: recarregarSlots,
  } = useQuery({
    queryKey: ["slots", barbeiroId, dia, servico?.duracao_minutos],
    enabled: !!barbeiroId && !!servico,
    queryFn: () => buscarHorariosDisponiveis(barbeiroId!, dia, servico!.duracao_minutos),
  });

  // Disponibilidade em tempo real: qualquer agendamento novo recarrega os horários livres.
  useEffect(() => {
    const canal = supabase
      .channel("agenda-tempo-real")
      .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, () => {
        queryClient.invalidateQueries({ queryKey: ["slots"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [queryClient]);

  const criar = useMutation({
    mutationFn: async () => {
      if (!userId || !servico || !barbeiroId || !slot) throw new Error("Dados incompletos");
      const inicio = new Date(slot);
      const fim = new Date(inicio.getTime() + servico.duracao_minutos * 60000);
      const { error } = await supabase.from("agendamentos").insert({
        cliente_id: userId,
        barbeiro_id: barbeiroId,
        servico_id: servico.id,
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        preco: servico.preco,
        observacoes: observacoes ? textoSeguro(observacoes, 300) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Horário confirmado!", { description: "Você pode ver e gerenciar em Meus horários." });
      queryClient.invalidateQueries();
      navigate({ to: "/meus-agendamentos" });
    },
    onError: (erro) => {
      toast.error("Não foi possível agendar", { description: mensagemErro(erro) });
      recarregarSlots();
    },
  });

  const dias = proximosDias(14);

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h1 className="text-3xl sm:text-4xl">AGENDAR HORÁRIO</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Olá {perfil?.nome?.split(" ")[0] || "cliente"}, são só {PASSOS.length} passos.
        </p>

        {fidelidade?.premio_disponivel && (
          <Card className="mt-5 border-primary/30 bg-primary/10">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-primary p-2 text-primary-foreground"><Gift size={20} /></div>
              <div>
                <p className="font-semibold">Seu próximo corte é GRÁTIS!</p>
                <p className="text-xs text-muted-foreground">O benefício será aplicado automaticamente neste novo agendamento.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <ol className="mt-5 flex items-center gap-2" aria-label="Etapas do agendamento">
          {PASSOS.map((p, i) => (
            <li key={p} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  i <= passo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
                aria-current={i === passo ? "step" : undefined}
              >
                {i < passo ? <Check size={14} aria-hidden="true" /> : i + 1}
              </span>
              <span className={cn("truncate text-xs sm:text-sm", i === passo && "font-semibold")}>{p}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 space-y-4">
          {passo === 0 &&
            (servicos ?? []).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setServicoId(s.id);
                  setSlot(null);
                  setPasso(1);
                }}
                className={cn(
                  "w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary",
                  servicoId === s.id && "border-primary",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-lg font-semibold">{s.nome}</span>
                  <span className="whitespace-nowrap font-semibold text-primary">{moeda(s.preco)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{s.descricao}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={13} aria-hidden="true" /> {s.duracao_minutos} min
                </p>
              </button>
            ))}

          {passo === 1 &&
            (barbeiros ?? []).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setBarbeiroId(b.id);
                  setSlot(null);
                  setPasso(2);
                }}
                className={cn(
                  "flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary",
                  barbeiroId === b.id && "border-primary",
                )}
              >
                <Foto caminho={b.foto_url} nome={b.nome} className="h-14 w-14" />
                <span className="min-w-0">
                  <span className="block text-lg font-semibold">{b.nome}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {b.especialidades?.join(" · ") || "Barbeiro"}
                  </span>
                  {b.media && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Estrelas nota={b.media} /> {b.media.toFixed(1)} ({b.total})
                    </span>
                  )}
                </span>
              </button>
            ))}

          {passo === 2 && (
            <>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                {dias.map((d) => {
                  const iso = isoData(d);
                  const ativo = iso === dia;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => {
                        setDia(iso);
                        setSlot(null);
                      }}
                      aria-pressed={ativo}
                      className={cn(
                        "flex min-w-16 flex-col items-center rounded-lg border px-3 py-2 text-sm",
                        ativo ? "border-primary bg-primary/10 text-primary" : "border-border bg-card",
                      )}
                    >
                      <span className="text-xs uppercase">
                        {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                      </span>
                      <span className="font-display text-xl leading-none">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>

              {buscandoSlots ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : (slots ?? []).length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    Nenhum horário livre neste dia com {barbeiro?.nome}. Escolha outra data.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {(slots ?? []).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSlot(s);
                        setPasso(3);
                      }}
                      className={cn(
                        "rounded-lg border py-2.5 text-sm font-medium",
                        slot === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-card",
                      )}
                    >
                      {hora(s)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {passo === 3 && servico && barbeiro && slot && (
            <Card>
              <CardContent className="space-y-3 p-5">
                <h2 className="text-2xl">RESUMO</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Serviço</dt>
                    <dd className="text-right font-medium">
                      {servico.nome} · {servico.duracao_minutos} min
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Barbeiro</dt>
                    <dd className="text-right font-medium">{barbeiro.nome}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Data</dt>
                    <dd className="text-right font-medium capitalize">{dataLonga(slot)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Hora</dt>
                    <dd className="text-right font-medium">{hora(slot)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Valor</dt>
                    <dd className="text-right font-semibold text-primary">{fidelidade?.premio_disponivel ? <><span className="mr-2 text-muted-foreground line-through">{moeda(servico.preco)}</span> GRÁTIS</> : moeda(servico.preco)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Pagamento</dt>
                    <dd className="text-right">
                      <Badge variant="secondary">A pagar no local</Badge>
                    </dd>
                  </div>
                </dl>
                <div className="space-y-2">
                  <label htmlFor="obs" className="text-sm text-muted-foreground">
                    Observação para o barbeiro (opcional)
                  </label>
                  <Textarea
                    id="obs"
                    maxLength={300}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Ex.: máquina 2 nas laterais"
                  />
                </div>
                <Button className="w-full" size="lg" disabled={criar.isPending} onClick={() => criar.mutate()}>
                  {criar.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                  Confirmar agendamento
                </Button>
              </CardContent>
            </Card>
          )}

          {passo > 0 && (
            <Button variant="ghost" onClick={() => setPasso((p) => p - 1)}>
              <ArrowLeft aria-hidden="true" /> Voltar
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
