import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Marca } from "@/components/Marca";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { mensagemErro, textoSeguro } from "@/lib/barbearia";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Navalha & Ouro" },
      { name: "description", content: "Acesse sua conta para agendar, remarcar ou avaliar atendimentos." },
      { property: "og:title", content: "Entrar — Navalha & Ouro" },
      { property: "og:description", content: "Acesse sua conta da barbearia Navalha & Ouro." },
    ],
  }),
  component: Autenticacao,
});

const esquemaCadastro = z.object({
  nome: z.string().min(2, "Informe seu nome").max(80),
  email: z.string().email("E-mail inválido"),
  telefone: z
    .string()
    .regex(/^[0-9()+\-\s]{10,20}$/, "Telefone inválido (use DDD)")
    .optional()
    .or(z.literal("")),
  senha: z.string().min(8, "A senha precisa de pelo menos 8 caracteres"),
  consentimento: z.literal(true, { message: "É necessário aceitar o uso dos dados (LGPD)" }),
});

function Autenticacao() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/agendar", replace: true });
  }, [session, navigate]);

  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(dados.get("email")).trim(),
      password: String(dados.get("senha")),
    });
    setCarregando(false);
    if (error) { toast.error("Não foi possível entrar", { description: mensagemErro(error) }); return; }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/agendar" });
  }

  async function criarConta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const bruto = {
      nome: textoSeguro(String(form.get("nome") ?? ""), 80),
      email: String(form.get("email") ?? "").trim(),
      telefone: String(form.get("telefone") ?? "").trim(),
      senha: String(form.get("senha") ?? ""),
      consentimento: form.get("consentimento") === "on",
    };
    const check = esquemaCadastro.safeParse(bruto);
    if (!check.success) {
      { toast.error("Confira os dados", { description: check.error.issues[0]?.message }); return; }
    }
    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email: bruto.email,
      password: bruto.senha,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome: bruto.nome, telefone: bruto.telefone, consentimento_lgpd: true },
      },
    });
    setCarregando(false);
    if (error) { toast.error("Não foi possível criar a conta", { description: mensagemErro(error) }); return; }
    if (!data.session) {
      { toast.success("Confirme seu e-mail", {
        description: "Enviamos um link de confirmação. Depois de confirmar, você já pode entrar.",
      }); return; }
    }
    toast.success("Conta criada!");
    navigate({ to: "/agendar" });
  }

  async function recuperar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setCarregando(false);
    if (error) { toast.error("Não foi possível enviar", { description: mensagemErro(error) }); return; }
    toast.success("Verifique seu e-mail para criar uma nova senha.");
    setModoRecuperar(false);
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) { toast.error("Falha no login com Google"); return; }
    if (result.redirected) return;
    navigate({ to: "/agendar" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Marca />
      <Card className="w-full max-w-md">
        <CardContent className="p-5 sm:p-6">
          {modoRecuperar ? (
            <form onSubmit={recuperar} className="space-y-4">
              <div>
                <h1 className="text-2xl">RECUPERAR SENHA</h1>
                <p className="text-sm text-muted-foreground">
                  Enviaremos um link para você criar uma nova senha.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rec-email">E-mail</Label>
                <Input id="rec-email" name="email" type="email" required autoComplete="email" />
              </div>
              <Button type="submit" className="w-full" disabled={carregando}>
                Enviar link
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setModoRecuperar(false)}>
                Voltar
              </Button>
            </form>
          ) : (
            <Tabs defaultValue="entrar">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="criar">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="entrar">
                <form onSubmit={entrar} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input id="login-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-senha">Senha</Label>
                    <Input
                      id="login-senha"
                      name="senha"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={carregando}>
                    Entrar
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm text-muted-foreground underline"
                    onClick={() => setModoRecuperar(true)}
                  >
                    Esqueci minha senha
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="criar">
                <form onSubmit={criarConta} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-nome">Nome completo</Label>
                    <Input id="c-nome" name="nome" required maxLength={80} autoComplete="name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-email">E-mail</Label>
                    <Input id="c-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-tel">Celular (WhatsApp)</Label>
                    <Input id="c-tel" name="telefone" inputMode="tel" placeholder="(11) 99999-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-senha">Senha</Label>
                    <Input
                      id="c-senha"
                      name="senha"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox id="c-lgpd" name="consentimento" />
                    <Label htmlFor="c-lgpd" className="text-xs leading-relaxed text-muted-foreground">
                      Autorizo o uso do meu nome, e-mail e telefone apenas para gerenciar meus
                      agendamentos, conforme a LGPD. Posso pedir a exclusão dos dados quando quiser.
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={carregando}>
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={google}>
              Continuar com Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
