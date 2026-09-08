import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Header } from "@/components/Header";
import { Foto } from "@/components/Foto";
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
      { title: "Minha conta — Navalha & Ouro" },
      { name: "description", content: "Atualize seus dados, foto e senha da conta da barbearia." },
      { property: "og:title", content: "Minha conta — Navalha & Ouro" },
      { property: "og:description", content: "Atualize seus dados, foto e senha." },
    ],
  }),
  component: Perfil;
});

function Perfil() {
  const { userId, perfil } = useAuth();
  const queryClient = useQueryClient();
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

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
      const { error } = await supabase.auth.updateUser({
        password: nova,
        // @ts-expect-error a senha atual é exigida pelo backend em trocas com sessão ativa
        current_password: String(form.get("atual")),
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Senha alterada"),
    onError: (erro) => toast.error("Não foi possível alterar a senha", { description: mensagemErro(erro) }),
  });

  async function enviarFoto(arquivo: File) {
    if (!userId) return;
    if (arquivo.size > 3 * 1024 * 1024) return toast.error("A imagem deve ter no máximo 3 MB");
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type))
      return toast.error("Use uma imagem JPG, PNG ou WEBP");
    setEnviando(true);
    const extensao = arquivo.type === "image/png" ? "png" : arquivo.type === "image/webp" ? "webp" : "jpg";
    const caminho = `perfis/${userId}/foto.${extensao}`;
    const { error: erroUpload } = await supabase.storage
      .from("fotos")
      .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });
    if (erroUpload) {
      setEnviando(false);
      return toast.error("Falha ao enviar a foto", { description: mensagemErro(erroUpload) });
    }
    const { error } = await supabase.from("profiles").update({ foto_url: caminho }).eq("id", userId);
    setEnviando(false);
    if (error) return toast.error("Falha ao salvar a foto", { description: mensagemErro(error) });
    toast.success("Foto atualizada");
    queryClient.invalidateQueries();
  }

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
        <h1 className="text-3xl sm:text-4xl">MINHA CONTA</h1>

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
                e.currentTarget.reset();
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
