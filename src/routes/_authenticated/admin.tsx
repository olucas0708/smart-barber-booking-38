import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Plus, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { AdminComercial } from "@/components/AdminComercial";
import { Estrelas } from "@/components/Estrelas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  baixarCsv,
  dataCurta,
  hora,
  isoData,
  mensagemErro,
  moeda,
  STATUS_LABEL,
  textoSeguro,
} from "@/lib/barbearia";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel do administrador — Navalha & Ouro" },
      { name: "description", content: "Indicadores, serviços, equipe e agenda geral da barbearia." },
      { property: "og:title", content: "Painel do administrador — Navalha & Ouro" },
      { property: "og:description", content: "Indicadores, serviços, equipe e agenda geral." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [dia, setDia] = useState(() => isoData(new Date()));

  const invalidar = () => queryClient.invalidateQueries();

  const { data: agendamentos } = useQuery({
    queryKey: ["admin-agendamentos"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(
          "id, cliente_id, inicio, status, preco, pagamento_status, barbeiros(nome), servicos(nome)",
        )
        .order("inicio", { ascending: false })
        .limit(500);
      if (error) throw error;
      const ids = [...new Set((data ?? []).map((a) => a.cliente_id))];
      const { data: pessoas } = ids.length
        ? await supabase.from("profiles").select("id, nome").in("id", ids)
        : { data: [] };
      const mapa = new Map((pessoas ?? []).map((c) => [c.id, c.nome]));
      return (data ?? []).map((a) => ({ ...a, clienteNome: mapa.get(a.cliente_id) ?? "Cliente" }));
    },
  });

  const { data: servicos } = useQuery({
    queryKey: ["admin-servicos"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("servicos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: barbeiros } = useQuery({
    queryKey: ["admin-barbeiros"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("barbeiros").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: avaliacoes } = useQuery({
    queryKey: ["admin-avaliacoes"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("id, nota, comentario, criado_em, barbeiros(nome)")
        .order("criado_em", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: clientes } = useQuery({
    queryKey: ["admin-clientes"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, telefone, bloqueado, criado_em")
        .order("criado_em", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const salvarServico = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from("servicos").insert({
        nome: textoSeguro(String(form.get("nome") ?? ""), 60),
        descricao: textoSeguro(String(form.get("descricao") ?? ""), 200) || null,
        duracao_minutos: Number(form.get("duracao")),
        preco: Number(form.get("preco")),
        categoria: textoSeguro(String(form.get("categoria") ?? ""), 40) || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Serviço criado");
      invalidar();
    },
    onError: (erro) => toast.error("Não foi possível criar", { description: mensagemErro(erro) }),
  });

  const alternarServico = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("servicos").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidar,
    onError: (erro) => toast.error("Não foi possível atualizar", { description: mensagemErro(erro) }),
  });

  const salvarBarbeiro = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from("barbeiros").insert({
        nome: textoSeguro(String(form.get("nome") ?? ""), 60),
        especialidades: String(form.get("especialidades") ?? "")
          .split(",")
          .map((e) => textoSeguro(e, 30))
          .filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profissional cadastrado");
      invalidar();
    },
    onError: (erro) => toast.error("Não foi possível cadastrar", { description: mensagemErro(erro) }),
  });

  const alternarBarbeiro = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("barbeiros").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidar,
    onError: (erro) => toast.error("Não foi possível atualizar", { description: mensagemErro(erro) }),
  });

  const alternarCliente = useMutation({
    mutationFn: async ({ id, bloqueado }: { id: string; bloqueado: boolean }) => {
      const { error } = await supabase.from("profiles").update({ bloqueado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidar,
    onError: (erro) => toast.error("Não foi possível atualizar", { description: mensagemErro(erro) }),
  });

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-3xl">ACESSO RESTRITO</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta área é exclusiva da administração da barbearia.
          </p>
        </main>
      </div>
    );
  }

  const lista = agendamentos ?? [];
  const hojeIso = isoData(new Date());
  const inicioMes = new Date();
  inicioMes.setDate(1);

  const kpis = [
    { titulo: "Hoje", valor: String(lista.filter((a) => isoData(new Date(a.inicio)) === hojeIso).length) },
    {
      titulo: "Receita do mês",
      valor: moeda(
        lista
          .filter((a) => a.status === "concluido" && new Date(a.inicio) >= inicioMes)
          .reduce((s, a) => s + Number(a.preco), 0),
      ),
    },
    {
      titulo: "Conclusão",
      valor: `${
        lista.length
          ? Math.round((lista.filter((a) => a.status === "concluido").length / lista.length) * 100)
          : 0
      }%`,
    },
    {
      titulo: "Nota média",
      valor: (avaliacoes ?? []).length
        ? ((avaliacoes ?? []).reduce((s, a) => s + a.nota, 0) / (avaliacoes ?? []).length).toFixed(1)
        : "—",
    },
  ];

  const doDia = lista.filter((a) => isoData(new Date(a.inicio)) === dia);

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <h1 className="text-3xl sm:text-4xl">PAINEL</h1>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.titulo}>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.titulo}</p>
                <p className="font-display text-3xl leading-tight text-primary">{k.valor}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <AdminComercial />

        <Tabs defaultValue="agenda" className="mt-6">
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
            <TabsTrigger value="equipe">Equipe</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          </TabsList>

          <TabsContent value="agenda" className="space-y-3 pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="admin-dia">Dia</Label>
                <Input
                  id="admin-dia"
                  type="date"
                  className="w-auto"
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  baixarCsv(`agendamentos-${dia}.csv`, [
                    ["Data", "Hora", "Cliente", "Barbeiro", "Serviço", "Status", "Valor", "Pagamento"],
                    ...doDia.map((a) => [
                      dataCurta(a.inicio),
                      hora(a.inicio),
                      a.clienteNome,
                      a.barbeiros?.nome ?? "",
                      a.servicos?.nome ?? "",
                      STATUS_LABEL[a.status] ?? a.status,
                      Number(a.preco).toFixed(2),
                      a.pagamento_status,
                    ]),
                  ])
                }
              >
                <Download aria-hidden="true" /> Exportar CSV
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-160 text-sm">
                <caption className="sr-only">Agendamentos do dia selecionado</caption>
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Hora</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Barbeiro</th>
                    <th className="p-3">Serviço</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {doDia.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="p-3 font-medium">{hora(a.inicio)}</td>
                      <td className="p-3">{a.clienteNome}</td>
                      <td className="p-3">{a.barbeiros?.nome}</td>
                      <td className="p-3">{a.servicos?.nome}</td>
                      <td className="p-3">
                        <Badge variant="secondary">{STATUS_LABEL[a.status]}</Badge>
                      </td>
                      <td className="p-3">{moeda(a.preco)}</td>
                    </tr>
                  ))}
                  {doDia.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        Nenhum agendamento neste dia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="servicos" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Novo serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-3 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    salvarServico.mutate(new FormData(e.currentTarget));
                    e.currentTarget.reset();
                  }}
                >
                  <div className="space-y-1">
                    <Label htmlFor="s-nome">Nome</Label>
                    <Input id="s-nome" name="nome" required maxLength={60} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="s-categoria">Categoria</Label>
                    <Input id="s-categoria" name="categoria" maxLength={40} placeholder="Cabelo, barba..." />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="s-duracao">Duração (min)</Label>
                    <Input id="s-duracao" name="duracao" type="number" min={10} max={240} step={5} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="s-preco">Preço (R$)</Label>
                    <Input id="s-preco" name="preco" type="number" min={0} step="0.01" required />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="s-desc">Descrição</Label>
                    <Textarea id="s-desc" name="descricao" maxLength={200} />
                  </div>
                  <Button type="submit" className="sm:col-span-2" disabled={salvarServico.isPending}>
                    <Plus aria-hidden="true" /> Criar serviço
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              {(servicos ?? []).map((s) => (
                <div key={s.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{s.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.duracao_minutos} min · {moeda(s.preco)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`sv-${s.id}`} className="text-xs text-muted-foreground">
                        Ativo
                      </Label>
                      <Switch
                        id={`sv-${s.id}`}
                        checked={s.ativo}
                        onCheckedChange={(ativo) => alternarServico.mutate({ id: s.id, ativo })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="equipe" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Novo profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-3 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    salvarBarbeiro.mutate(new FormData(e.currentTarget));
                    e.currentTarget.reset();
                  }}
                >
                  <div className="space-y-1">
                    <Label htmlFor="b-nome">Nome</Label>
                    <Input id="b-nome" name="nome" required maxLength={60} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="b-esp">Especialidades (separadas por vírgula)</Label>
                    <Input id="b-esp" name="especialidades" placeholder="Degradê, barba" />
                  </div>
                  <Button type="submit" className="sm:col-span-2" disabled={salvarBarbeiro.isPending}>
                    <Plus aria-hidden="true" /> Cadastrar
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              {(barbeiros ?? []).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-semibold">{b.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.especialidades?.join(" · ") || "Sem especialidades"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`bv-${b.id}`} className="text-xs text-muted-foreground">
                      Ativo
                    </Label>
                    <Switch
                      id={`bv-${b.id}`}
                      checked={b.ativo}
                      onCheckedChange={(ativo) => alternarBarbeiro.mutate({ id: b.id, ativo })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="clientes" className="space-y-3 pt-4">
            {(clientes ?? []).map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div>
                  <p className="font-semibold">{c.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.email} {c.telefone ? `· ${c.telefone}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`cb-${c.id}`} className="text-xs text-muted-foreground">
                    Bloqueado
                  </Label>
                  <Switch
                    id={`cb-${c.id}`}
                    checked={c.bloqueado}
                    onCheckedChange={(bloqueado) => alternarCliente.mutate({ id: c.id, bloqueado })}
                  />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="avaliacoes" className="space-y-3 pt-4">
            {(avaliacoes ?? []).length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Nenhuma avaliação recebida ainda.
                </CardContent>
              </Card>
            )}
            {(avaliacoes ?? []).map((a) => (
              <div key={a.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Star size={14} className="fill-primary text-primary" aria-hidden="true" />
                    {a.barbeiros?.nome}
                  </span>
                  <Estrelas nota={a.nota} />
                </div>
                {a.comentario && <p className="mt-2 text-sm text-muted-foreground">“{a.comentario}”</p>}
                <p className="mt-1 text-xs text-muted-foreground">{dataCurta(a.criado_em)}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
