import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Clock, MapPin, ShieldCheck, Smartphone } from "lucide-react";
import { Header } from "@/components/Header";
import { Estrelas } from "@/components/Estrelas";
import { Foto } from "@/components/Foto";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { moeda } from "@/lib/barbearia";
import { useAuth } from "@/lib/auth";
import heroImg from "@/assets/hero-barbearia.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Navalha & Ouro — Agende seu corte online" },
      {
        name: "description",
        content:
          "Barbearia Navalha & Ouro: escolha serviço, barbeiro e horário em poucos toques. Agenda em tempo real, sem fila e sem telefone.",
      },
      { property: "og:title", content: "Navalha & Ouro — Agende seu corte online" },
      {
        property: "og:description",
        content: "Escolha serviço, barbeiro e horário em poucos toques. Agenda em tempo real.",
      },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { session } = useAuth();

  const { data: servicos, isLoading: carregandoServicos } = useQuery({
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

  const { data: equipe } = useQuery({
    queryKey: ["equipe-publica"],
    queryFn: async () => {
      const [{ data: barbeiros, error }, { data: avaliacoes }] = await Promise.all([
        supabase.from("barbeiros").select("id, nome, foto_url, especialidades").eq("ativo", true).order("nome"),
        supabase.from("avaliacoes").select("barbeiro_id, nota"),
      ]);
      if (error) throw error;
      return (barbeiros ?? []).map((b) => {
        const notas = (avaliacoes ?? []).filter((a) => a.barbeiro_id === b.id).map((a) => a.nota);
        return {
          ...b,
          media: notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null,
          total: notas.length,
        };
      });
    },
  });

  const { data: config } = useQuery({
    queryKey: ["config-publica"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("nome, hora_abertura, hora_fechamento, dias_funcionamento")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: depoimentos } = useQuery({
    queryKey: ["depoimentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("id, nota, comentario, criado_em")
        .not("comentario", "is", null)
        .order("criado_em", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <section className="relative isolate overflow-hidden">
          <img
            src={heroImg}
            alt="Interior da barbearia Navalha & Ouro com cadeira de barbeiro e iluminação âmbar"
            width={1600}
            height={1008}
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <Badge variant="outline" className="border-primary/50 text-primary">
              Agenda em tempo real
            </Badge>
            <h1 className="mt-4 max-w-2xl text-5xl leading-[0.95] sm:text-7xl">
              SEU CORTE, <span className="text-primary">NA HORA CERTA.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Escolha o serviço, o barbeiro e o horário livre. Em menos de um minuto seu lugar na
              cadeira está garantido — sem telefone e sem espera.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={session ? "/agendar" : "/auth"}>
                  <CalendarCheck aria-hidden="true" /> Agendar agora
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#servicos">Ver serviços e preços</a>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icone: Clock, titulo: "3 passos", texto: "Serviço, barbeiro, horário." },
                { icone: Smartphone, titulo: "No celular", texto: "Instale na tela inicial." },
                { icone: ShieldCheck, titulo: "Seus dados", texto: "Privados e sob a LGPD." },
              ].map((item) => (
                <div key={item.titulo} className="rounded-lg border border-border/70 bg-card/60 p-4">
                  <item.icone className="text-primary" aria-hidden="true" />
                  <dt className="mt-2 font-semibold">{item.titulo}</dt>
                  <dd className="text-sm text-muted-foreground">{item.texto}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="servicos" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl sm:text-4xl">SERVIÇOS</h2>
          <p className="mt-1 text-sm text-muted-foreground">Preços e duração de cada atendimento.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {carregandoServicos
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
              : (servicos ?? []).map((s) => (
                  <Card key={s.id}>
                    <CardContent className="flex h-full flex-col gap-2 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl leading-tight">{s.nome}</h3>
                        <span className="whitespace-nowrap font-semibold text-primary">
                          {moeda(s.preco)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{s.descricao}</p>
                      <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                        <Clock size={14} aria-hidden="true" /> {s.duracao_minutos} min
                        {s.categoria && <Badge variant="secondary">{s.categoria}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </section>

        <section className="border-y border-border/70 bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl sm:text-4xl">NOSSA EQUIPE</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(equipe ?? []).map((b) => (
                <Card key={b.id}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <Foto caminho={b.foto_url} nome={b.nome} className="h-16 w-16" />
                    <div className="min-w-0">
                      <h3 className="truncate text-xl leading-tight">{b.nome}</h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {b.especialidades?.join(" · ") || "Barbeiro"}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {b.media ? (
                          <>
                            <Estrelas nota={b.media} />
                            {b.media.toFixed(1)} ({b.total})
                          </>
                        ) : (
                          "Sem avaliações ainda"
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {(depoimentos ?? []).length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl sm:text-4xl">O QUE DIZEM OS CLIENTES</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(depoimentos ?? []).map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-5">
                    <Estrelas nota={a.nota} />
                    <p className="mt-2 text-sm text-muted-foreground">{a.comentario}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border/70 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:px-6">
          <p className="font-display text-2xl text-foreground">{config?.nome ?? "Navalha & Ouro"}</p>
          <p className="flex items-center gap-2">
            <Clock size={14} aria-hidden="true" />
            Aberto de {config?.hora_abertura?.slice(0, 5) ?? "09:00"} às{" "}
            {config?.hora_fechamento?.slice(0, 5) ?? "20:00"}
          </p>
          <p className="flex items-center gap-2">
            <MapPin size={14} aria-hidden="true" /> Endereço e telefone ainda não informados — envie os
            dados reais para publicarmos aqui.
          </p>
          <p>Seus dados são tratados conforme a LGPD. Você pode pedir a exclusão da conta a qualquer momento.</p>
        </div>
      </footer>
    </div>
  );
}
