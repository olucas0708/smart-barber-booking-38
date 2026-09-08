import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarOff, Loader2, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";
import { dataCurta, hora, isoData, mensagemErro, moeda, STATUS_LABEL } from "@/lib/barbearia";

export const Route = createFileRoute("/_authenticated/barbeiro")({
  head: () => ({
    meta: [
      { title: "Minha agenda — Navalha & Ouro" },
      { name: "description", content: "Agenda do dia, atendimentos e bloqueios do barbeiro." },
      { property: "og:title", content: "Minha agenda — Navalha & Ouro" },
      { property: "og:description", content: "Agenda do dia, atendimentos e bloqueios." },
    ],
  }),
  component: AreaBarbeiro,
});

function AreaBarbeiro() {
  const { barbeiroId, isBarbeiro, isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [dia, setDia] = useState(() => isoData(new Date()));

  const { data: agenda, isFetching } = useQuery({
    queryKey: ["agenda-barbeiro", barbeiroId, dia],
    enabled: !!barbeiroId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("id, cliente_id, inicio, fim, status, preco, pagamento_status, observacoes, servicos(nome)")
        .eq("barbeiro_id", barbeiroId!)
        .gte("inicio", `${dia}T00:00:00`)
        .lte("inicio", `${dia}T23:59:59`)
        .order("inicio");
      if (error) throw error;
      const ids = [...new Set((data ?? []).map((a) => a.cliente_id))];
      const { data: clientes } = ids.length
        ? await supabase.from("profiles").select("id, nome, telefone").in("id", ids)
        : { data: [] };
      const mapa = new Map((clientes ?? []).map((c) => [c.id, c]));
      return (data ?? []).map((a) => ({ ...a, cliente: mapa.get(a.cliente_id) ?? null }));
    },
  });

  const { data: bloqueios } = useQuery({
    queryKey: ["bloqueios", barbeiroId],
    enabled: !!barbeiroId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bloqueios")
        .select("id, data, hora_inicio, hora_fim, motivo")
        .eq("barbeiro_id", barbeiroId!)
        .gte("data", isoData(new Date()))
        .order("data");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const canal = supabase
      .channel("agenda-barbeiro")
      .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, () => {
        queryClient.invalidateQueries({ queryKey: ["agenda-barbeiro"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [queryClient]);

  const atualizar = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Database["public"]["Tables"]["agendamentos"]["Update"] }) => {
      const { error } = await supabase.from("agendamentos").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atendimento atualizado");
      queryClient.invalidateQueries({ queryKey: ["agenda-barbeiro"] });
    },
    onError: (erro) => toast.error("Não foi possível atualizar", { description: mensagemErro(erro) }),
  });

  const criarBloqueio = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from("bloqueios").insert({
        barbeiro_id: barbeiroId!,
        data: String(form.get("data")),
        hora_inicio: String(form.get("inicio")),
        hora_fim: String(form.get("fim")),
        motivo: String(form.get("motivo") || "") || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloqueio criado");
      queryClient.invalidateQueries({ queryKey: ["bloqueios"] });
    },
    onError: (erro) => toast.error("Não foi possível bloquear", { description: mensagemErro(erro) }),
  });

  const removerBloqueio = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bloqueios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bloqueios"] }),
  });

  if (loading) return null;

  if (!barbeiroId) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-3xl">ÁREA DO BARBEIRO</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isBarbeiro || isAdmin
              ? "Sua conta ainda não está ligada a um profissional. Peça ao administrador para vincular."
              : "Esta área é exclusiva dos profissionais da barbearia."}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <h1 className="text-3xl sm:text-4xl">MINHA AGENDA</h1>

        <Tabs defaultValue="dia" className="mt-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dia">Atendimentos</TabsTrigger>
            <TabsTrigger value="bloqueios">Bloqueios</TabsTrigger>
          </TabsList>

          <TabsContent value="dia" className="space-y-3 pt-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="dia" className="text-sm">
                Dia
              </Label>
              <Input
                id="dia"
                type="date"
                className="w-auto"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
              />
              {isFetching && <Loader2 className="animate-spin text-muted-foreground" aria-hidden="true" />}
            </div>

            {(agenda ?? []).length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum atendimento marcado para este dia.
                </CardContent>
              </Card>
            )}

            {(agenda ?? []).map((a) => (
              <Card key={a.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl leading-none">
                        {hora(a.inicio)} <span className="text-sm text-muted-foreground">– {hora(a.fim)}</span>
                      </p>
                      <p className="mt-1 font-semibold">{a.cliente?.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.servicos?.nome} · {moeda(a.preco)}
                        {a.cliente?.telefone ? ` · ${a.cliente.telefone}` : ""}
                      </p>
                      {a.observacoes && <p className="mt-1 text-sm italic">“{a.observacoes}”</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge>{STATUS_LABEL[a.status]}</Badge>
                      <Badge variant="secondary">
                        {a.pagamento_status === "pago" ? "Pago" : "A pagar no local"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {a.status === "pendente" && (
                      <Button
                        size="sm"
                        onClick={() => atualizar.mutate({ id: a.id, patch: { status: "confirmado" } })}
                      >
                        Confirmar
                      </Button>
                    )}
                    {["pendente", "confirmado"].includes(a.status) && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => atualizar.mutate({ id: a.id, patch: { status: "concluido" } })}
                        >
                          Concluir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => atualizar.mutate({ id: a.id, patch: { status: "nao_compareceu" } })}
                        >
                          Não compareceu
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => atualizar.mutate({ id: a.id, patch: { status: "cancelado" } })}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    {a.pagamento_status !== "pago" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          atualizar.mutate({
                            id: a.id,
                            patch: { pagamento_status: "pago", pagamento_metodo: "local" },
                          })
                        }
                      >
                        Marcar como pago
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="bloqueios" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Bloquear período</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-3 sm:grid-cols-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    criarBloqueio.mutate(new FormData(e.currentTarget));
                    e.currentTarget.reset();
                  }}
                >
                  <div className="space-y-1">
                    <Label htmlFor="b-data">Data</Label>
                    <Input id="b-data" name="data" type="date" required min={isoData(new Date())} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="b-inicio">Início</Label>
                    <Input id="b-inicio" name="inicio" type="time" required defaultValue="12:00" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="b-fim">Fim</Label>
                    <Input id="b-fim" name="fim" type="time" required defaultValue="13:00" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="b-motivo">Motivo</Label>
                    <Input id="b-motivo" name="motivo" maxLength={80} placeholder="Almoço, curso..." />
                  </div>
                  <Button type="submit" className="sm:col-span-4" disabled={criarBloqueio.isPending}>
                    <CalendarOff aria-hidden="true" /> Bloquear
                  </Button>
                </form>
              </CardContent>
            </Card>

            {(bloqueios ?? []).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span className="text-sm">
                  <strong>{dataCurta(b.data)}</strong> · {b.hora_inicio.slice(0, 5)} às {b.hora_fim.slice(0, 5)}
                  {b.motivo ? ` · ${b.motivo}` : ""}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Remover bloqueio"
                  onClick={() => removerBloqueio.mutate(b.id)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
