import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  Instagram,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ExperienciaBarbearia } from "@/components/ExperienciaBarbearia";
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

const WHATSAPP = "5534992041902";
const INSTAGRAM = "https://www.instagram.com/romariobarbershop.roosevelt/";
const MAPS = "https://www.google.com/maps/search/?api=1&query=Avenida+Jo%C3%A3o+Bernardes+de+Souza%2C+438%2C+Presidente+Roosevelt%2C+Uberl%C3%A2ndia%2C+MG";
const ADDRESS = "Av. João Bernardes de Souza, 438 — Presidente Roosevelt, Uberlândia/MG";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Romario Barber Shop — Presidente Roosevelt | Uberlândia" },
      {
        name: "description",
        content:
          "Romario Barber Shop em Presidente Roosevelt, Uberlândia. Conheça a barbearia, veja serviços e agende seu horário online.",
      },
      { property: "og:title", content: "Romario Barber Shop — Presidente Roosevelt" },
      {
        property: "og:description",
        content: "Seu próximo corte começa aqui. Consulte serviços e agende seu horário.",
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
        .select("id, nome, descricao, duracao_minutos, preco, categoria, preco_a_partir")
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
        supabase.from("barbeiros").select("id, nome, foto_url, especialidades, cargo, bio, ordem").eq("ativo", true).order("ordem").order("nome"),
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

  const bookingHref = session ? "/agendar" : "/auth";
  const whatsappHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá! Quero agendar um horário na Romario Barber Shop.")}`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Header />

      <main>
        <section className="hero-section relative isolate overflow-hidden">
          <img
            src={heroImg}
            alt="Ambiente de barbearia com cadeira e iluminação aconchegante"
            width={1600}
            height={1008}
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_38%,rgba(203,164,82,.22),transparent_34%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background" />

          <div className="relative mx-auto flex min-h-[min(820px,calc(100svh-56px))] max-w-7xl items-end px-5 pb-16 pt-20 sm:px-8 sm:pb-24 lg:items-center lg:pt-16">
            <div className="max-w-3xl">
              <div className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_currentColor]" />
                Presidente Roosevelt · Uberlândia
              </div>

              <h1 className="mt-6 max-w-3xl text-[4rem] leading-[0.84] tracking-tight sm:text-8xl lg:text-[7.4rem]">
                ESTILO QUE
                <span className="block text-gold-gradient">COMEÇA NA CADEIRA.</span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                A experiência da <strong className="text-foreground">Romario Barber Shop</strong> agora
                começa antes mesmo de você chegar. Escolha seu atendimento e reserve seu horário.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-6 shadow-[0_12px_40px_rgba(205,165,82,.18)]">
                  <Link to={bookingHref}>
                    <CalendarCheck aria-hidden="true" />
                    Agendar meu horário
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-white/15 bg-white/[0.04] px-6 backdrop-blur">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <MessageCircle aria-hidden="true" />
                    Falar no WhatsApp
                  </a>
                </Button>
              </div>

              <div className="mt-12 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { icon: CalendarCheck, title: "Agendamento", text: "Reserve seu horário online." },
                  { icon: Sparkles, title: "Experiência", text: "Cuidado em cada detalhe." },
                  { icon: ShieldCheck, title: "Praticidade", text: "Tudo em poucos toques." },
                ].map((item) => (
                  <div key={item.title} className="glass-panel rounded-2xl p-4">
                    <item.icon className="text-primary" size={19} aria-hidden="true" />
                    <p className="mt-3 text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 lg:flex">
            <span className="h-px w-12 bg-border" /> role para explorar <span className="h-px w-12 bg-border" />
          </div>
        </section>

        <section id="servicos" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="section-kicker">O menu da casa</p>
              <h2 className="mt-2 text-4xl sm:text-6xl">SERVIÇOS</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Os serviços e valores abaixo vêm da agenda da barbearia. O catálogo pode ser atualizado pelo
              painel sem alterar o site.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {carregandoServicos
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)
              : (servicos ?? []).length > 0
                ? (servicos ?? []).map((s) => (
                    <Card key={s.id} className="premium-card group">
                      <CardContent className="flex h-full min-h-40 flex-col gap-3 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            {s.categoria && (
                              <Badge variant="secondary" className="mb-2 rounded-full text-[10px] uppercase tracking-wider">
                                {s.categoria}
                              </Badge>
                            )}
                            <h3 className="text-2xl leading-none">{s.nome}</h3>
                          </div>
                          <span className="whitespace-nowrap text-sm font-semibold text-primary">{s.preco_a_partir ? `A partir de: ${moeda(s.preco)}` : moeda(s.preco)}</span>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">{s.descricao}</p>
                        <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                          <Clock3 size={14} aria-hidden="true" />
                          {s.duracao_minutos} min
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : (
                    <Card className="premium-card sm:col-span-2 lg:col-span-3">
                      <CardContent className="p-7 text-sm text-muted-foreground">
                        Os serviços estão sendo atualizados. Entre em contato pelo WhatsApp para consultar
                        disponibilidade e valores.
                      </CardContent>
                    </Card>
                  )}
          </div>
        </section>

        <section className="border-y border-border/70 bg-card/30">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:py-28">
            <div>
              <p className="section-kicker">A equipe</p>
              <h2 className="mt-2 text-4xl sm:text-6xl">QUEM CUIDA DO SEU VISUAL.</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                Conheça os profissionais cadastrados na agenda e escolha quem vai cuidar do seu próximo
                atendimento.
              </p>
              <Button asChild variant="outline" className="mt-7">
                <Link to="/promocoes">Ver promoções</Link>
              </Button>
              <Button asChild variant="outline" className="mt-3 sm:ml-2 lg:ml-0">
                <Link to={bookingHref}>Escolher barbeiro <ArrowRight aria-hidden="true" /></Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(equipe ?? []).length > 0 ? (
                (equipe ?? []).map((b) => (
                  <Card key={b.id} className="premium-card">
                    <CardContent className="flex items-center gap-4 p-5">
                      <Foto caminho={b.foto_url} nome={b.nome} className="h-20 w-20" />
                      <div className="min-w-0">
                        <h3 className="truncate text-2xl leading-none">{b.nome}</h3>
                        <p className="mt-2 truncate text-xs text-muted-foreground">
                          {b.cargo || "Barbeiro"} · {b.especialidades?.join(" · ") || "Barbeiro"}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          {b.media ? (
                            <>
                              <Estrelas nota={b.media} />
                              <span>{b.media.toFixed(1)}</span>
                            </>
                          ) : (
                            "Perfil disponível na agenda"
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="premium-card sm:col-span-2">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    A equipe aparecerá aqui assim que os profissionais forem cadastrados.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {(depoimentos ?? []).length > 0 && (
          <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Experiências reais</p>
                <h2 className="mt-2 text-4xl sm:text-6xl">QUEM JÁ SENTOU NA CADEIRA.</h2>
              </div>
              <Star className="hidden fill-primary text-primary sm:block" size={30} aria-hidden="true" />
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(depoimentos ?? []).map((a) => (
                <Card key={a.id} className="premium-card">
                  <CardContent className="p-6">
                    <Estrelas nota={a.nota} />
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">“{a.comentario}”</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <ExperienciaBarbearia />

        <section id="localizacao" className="border-t border-border/70">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
            <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(203,164,82,.18),transparent_45%)]" />
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:42px_42px]" />
              <div className="relative flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full border border-primary/30 bg-primary/10 p-4 text-primary">
                  <MapPin size={30} aria-hidden="true" />
                </div>
                <p className="mt-5 text-xs uppercase tracking-[0.24em] text-primary">Estamos no Roosevelt</p>
                <h3 className="mt-2 text-3xl">ROMARIO BARBER SHOP</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{ADDRESS}</p>
                <Button asChild className="mt-6">
                  <a href={MAPS} target="_blank" rel="noreferrer">Abrir no Google Maps <ArrowRight aria-hidden="true" /></a>
                </Button>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="section-kicker">Visite a casa</p>
              <h2 className="mt-2 text-4xl sm:text-5xl">SEU PRÓXIMO CORTE COMEÇA AQUI.</h2>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                Ficamos na Avenida João Bernardes de Souza, no Presidente Roosevelt. Para confirmar
                horários, serviços ou tirar dúvidas, fale diretamente com a equipe.
              </p>

              <div className="mt-8 grid gap-3">
                <a className="contact-row" href={whatsappHref} target="_blank" rel="noreferrer">
                  <MessageCircle size={20} aria-hidden="true" />
                  <span><strong>WhatsApp</strong><small>(34) 99204-1902</small></span>
                  <ArrowRight className="ml-auto" size={17} aria-hidden="true" />
                </a>
                <a className="contact-row" href={INSTAGRAM} target="_blank" rel="noreferrer">
                  <Instagram size={20} aria-hidden="true" />
                  <span><strong>Instagram</strong><small>@romariobarbershop.roosevelt</small></span>
                  <ArrowRight className="ml-auto" size={17} aria-hidden="true" />
                </a>
                <a className="contact-row" href={MAPS} target="_blank" rel="noreferrer">
                  <MapPin size={20} aria-hidden="true" />
                  <span><strong>Endereço</strong><small>Av. João Bernardes de Souza, 438</small></span>
                  <ArrowRight className="ml-auto" size={17} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-black/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-3xl tracking-wide">ROMARIO <span className="text-primary">BARBER SHOP</span></p>
            <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
              Presidente Roosevelt · Uberlândia/MG. Agendamento online integrado à agenda da barbearia.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm"><Link to={bookingHref}><CalendarCheck aria-hidden="true" /> Agendar</Link></Button>
            <Button asChild size="sm" variant="outline"><a href={INSTAGRAM} target="_blank" rel="noreferrer"><Instagram aria-hidden="true" /> Instagram</a></Button>
          </div>
        </div>
        <div className="border-t border-border/60 px-5 py-4 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Romario Barber Shop. Todos os direitos reservados.
          {config?.nome ? ` · Agenda: ${config.nome}` : ""}
        </div>
      </footer>
    </div>
  );
}
