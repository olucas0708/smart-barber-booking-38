import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarCheck, Scissors, Star, Upload } from "lucide-react";
import { Header } from "@/components/Header";
import { Foto } from "@/components/Foto";
import { ProgramaFidelidade } from "@/components/ProgramaFidelidade";
import { ClientePlus } from "@/components/ClientePlus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { mensagemErro, textoSeguro } from "@/lib/barbearia";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Minha conta — Romario Barber Shop" },
      { name: "description", content: "Atualize seus dados, foto e senha da conta da barbearia." },
      { property: "og:title", content: "Minha conta — Romario Barber Shop" },
      { property: "og:description", content: "Atualize seus dados, foto e senha." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { userId, perfil } = useAuth();
  const queryClient = useQueryClient();
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const { data: resumo } = useQuery({
    queryKey: ["resumo-cliente", userId], enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("agendamentos").select("id,inicio,status,preco,servicos(nome),barbeiros(nome),avaliacoes(nota)").eq("cliente_id", userId!).order("inicio", { ascending: false }).limit(100);
      if (error) throw error;
      const itens = data ?? [];
      const futuros = itens.filter((a:any) => new Date(a.inicio).getTime() >= Date.now() && ["pendente","confirmado"].includes(a.status));
      const concluidos = itens.filter((a:any) => a.status === "concluido");
      const notas = concluidos.flatMap((a:any) => (a.avaliacoes ?? []).map((x:any)=>x.nota));
      return { proximo: futuros[0] ?? null, total: concluidos.length, nota: notas.length ? notas.reduce((s:number,n:number)=>s+n,0)/notas.length : null };
    },
  });

  const { data: foto } = useQuery({
    queryKey: ["minha-foto", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("foto_url").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data?.foto_url ?? null;
    },
  });

  const salvarDados = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: textoSeguro(String(form.get("nome") ?? ""), 80),
          telefone: textoSeguro(String(form.get("telefone") ?? ""), 20) || null,
        })
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados atualizados");
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
    },
    onError: (erro) => toast.error("Não foi possível salvar", { description: mensagemErro(erro) }),
  });

  const trocarSenha = useMutation({
    mutationFn: async (form: FormData) => {
      const nova = String(form.get("nova"));
      if (nova.length < 8) throw new Error("A nova senha precisa de pelo menos 8 caracteres");
      const atual = String(form.get("atual") ?? "");
      const email = perfil?.email;
      if (!email || !atual) throw new Error("Informe a senha atual");

      const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: atual });
      if (reauthError) throw new Error("A senha atual está incorreta");

      const { error } = await supabase.auth.updateUser({ password: nova });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Senha alterada"),
    onError: (erro) => toast.error("Não foi possível alterar a senha", { description: mensagemErro(erro) }),
  });

  async function enviarFoto(arquivo: File) {
    if (!userId) return;
    if (arquivo.size > 3 * 1024 * 1024) { toast.error("A imagem deve ter no máximo 3 MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type))
      { toast.error("Use uma imagem JPG, PNG ou WEBP"); return; }
    setEnviando(true);
    const extensao = arquivo.type === "image/png" ? "png" : arquivo.type === "image/webp" ? "webp" : "jpg";
    const caminho = `perfis/${userId}/foto.${extensao}`;
    const { error: erroUpload } = await supabase.storage
      .from("fotos")
      .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });
    if (erroUpload) {
      setEnviando(false);
      { toast.error("Falha ao enviar a foto", { description: mensagemErro(erroUpload) }); return; }
    }
    const { error } = await supabase.from("profiles").update({ foto_url: caminho }).eq("id", userId);
    setEnviando(false);
    if (error) { toast.error("Falha ao salvar a foto", { description: mensagemErro(error) }); return; }
    toast.success("Foto atualizada");
    queryClient.invalidateQueries();
  }

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
        <h1 className="text-3xl sm:text-4xl">MINHA CONTA</h1>

        <ProgramaFidelidade />
        <ClientePlus />
        {resumo && <section className="grid gap-3 sm:grid-cols-2">
          <Card className="premium-card sm:col-span-2"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div><p className="text-xs uppercase tracking-[.2em] text-primary">Seu próximo corte</p>
              <p className="mt-1 text-xl font-semibold">{resumo.proximo ? (resumo.proximo.servicos?.nome ?? "Atendimento") + " · " + new Date(resumo.proximo.inicio).toLocaleDateString("pt-BR") : "Nenhum horário marcado"}</p>
              <p className="text-sm text-muted-foreground">{resumo.proximo ? "com " + (resumo.proximo.barbeiros?.nome ?? "barbeiro") : "Agende agora para manter sua rotina."}</p>
            </div><Button asChild><a href="/agendar"><CalendarCheck/> {resumo.proximo ? "Novo horário" : "Agendar agora"}</a></Button>
          </CardContent></Card>
          <Card><CardContent className="p-5"><Scissors className="text-primary" size={18}/><p className="mt-2 text-xs text-muted-foreground">Cortes concluídos</p><p className="font-display text-3xl">{resumo.total}</p></CardContent></Card>
          <Card><CardContent className="p-5"><Star className="text-primary" size={18}/><p className="mt-2 text-xs text-muted-foreground">Sua média de avaliações</p><p className="font-display text-3xl">{resumo.nota ? resumo.nota.toFixed(1) : "—"}</p></CardContent></Card>
        </section>}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Foto</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Foto caminho={foto} nome={perfil?.nome ?? "Cliente"} className="h-20 w-20 text-2xl" />
            <div>
              <input
                ref={arquivoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const arquivo = e.target.files?.[0];
                  if (arquivo) enviarFoto(arquivo);
                }}
              />
              <Button variant="outline" disabled={enviando} onClick={() => arquivoRef.current?.click()}>
                <Upload aria-hidden="true" /> {enviando ? "Enviando..." : "Escolher imagem"}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WEBP até 3 MB.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                salvarDados.mutate(new FormData(e.currentTarget));
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" name="nome" defaultValue={perfil?.nome ?? ""} required maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Celular</Label>
                <Input id="telefone" name="telefone" defaultValue={perfil?.telefone ?? ""} inputMode="tel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={perfil?.email ?? ""} disabled />
              </div>
              <Button type="submit" disabled={salvarDados.isPending}>
                Salvar alterações
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Segurança</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                trocarSenha.mutate(new FormData(e.currentTarget));
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="atual">Senha atual</Label>
                <Input id="atual" name="atual" type="password" required autoComplete="current-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nova">Nova senha</Label>
                <Input id="nova" name="nova" type="password" required minLength={8} autoComplete="new-password" />
              </div>
              <Button type="submit" variant="outline" disabled={trocarSenha.isPending}>
                Alterar senha
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Seus dados são usados apenas para gerenciar atendimentos (LGPD). Para excluir sua conta e seu
          histórico, fale com a barbearia pelo WhatsApp.
        </p>
      </main>
    </div>
  );
}
