import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Marca } from "@/components/Marca";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { mensagemErro } from "@/lib/barbearia";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Navalha & Ouro" },
      { name: "description", content: "Defina uma nova senha para sua conta da barbearia." },
      { property: "og:title", content: "Nova senha — Navalha & Ouro" },
      { property: "og:description", content: "Defina uma nova senha para sua conta." },
    ],
  }),
  component: NovaSenha,
});

function NovaSenha() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const senha = String(form.get("senha"));
    if (senha.length < 8) return toast.error("A senha precisa de pelo menos 8 caracteres");
    if (senha !== String(form.get("confirmar"))) return toast.error("As senhas não são iguais");
    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);
    if (error) return toast.error("Não foi possível salvar", { description: mensagemErro(error) });
    toast.success("Senha atualizada!");
    navigate({ to: "/agendar", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Marca />
      <Card className="w-full max-w-md">
        <CardContent className="p-5 sm:p-6">
          <h1 className="text-2xl">NOVA SENHA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha uma senha com pelo menos 8 caracteres.
          </p>
          <form onSubmit={salvar} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha">Nova senha</Label>
              <Input id="senha" name="senha" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar senha</Label>
              <Input id="confirmar" name="confirmar" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full" disabled={carregando}>
              Salvar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
