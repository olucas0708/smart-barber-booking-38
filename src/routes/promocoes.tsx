import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarCheck, Percent, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/promocoes")({head:()=>({meta:[{title:"Promoções — Romario Barber Shop"},{name:"description",content:"Promoções e benefícios da Romario Barber Shop."}]}),component:Promocoes});
function Promocoes(){
 const {data=[]}=useQuery({queryKey:["promocoes-publicas"],queryFn:async()=>{const {data,error}=await supabase.from("promocoes" as never).select("*").eq("ativo",true).order("destaque",{ascending:false});if(error)throw error;return (data??[]) as any[];}});
 return <div className="min-h-screen"><Header/><main className="mx-auto max-w-5xl px-5 py-16 sm:px-8"><p className="section-kicker">Ofertas da casa</p><h1 className="mt-2 text-5xl sm:text-7xl">PROMOÇÕES</h1><p className="mt-5 max-w-2xl text-muted-foreground">Benefícios, campanhas e vantagens para quem escolhe a Romario Barber Shop.</p><div className="mt-10 grid gap-4 sm:grid-cols-2">{data.map((p:any)=><Card key={p.id} className="premium-card"><CardContent className="p-6"><div className="flex items-start justify-between gap-3"><div className="rounded-full bg-primary/10 p-3 text-primary"><Percent/></div><Badge variant="secondary">{p.validade_fim?`Até ${new Date(p.validade_fim+"T00:00:00").toLocaleDateString("pt-BR")}`:"Por tempo indeterminado"}</Badge></div><h2 className="mt-6 text-3xl">{p.titulo}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{p.descricao}</p>{p.percentual_desconto&&<p className="mt-4 text-2xl font-semibold text-primary">{p.percentual_desconto}% OFF</p>}{p.preco_promocional&&<p className="mt-4 text-2xl font-semibold text-primary">R$ {Number(p.preco_promocional).toFixed(2).replace(".",",")}</p>}<Button asChild className="mt-6"><Link to="/agendar"><CalendarCheck/> Aproveitar <ArrowRight/></Link></Button></CardContent></Card>)}{!data.length&&<Card><CardContent className="p-8 text-center text-muted-foreground"><Sparkles className="mx-auto mb-3 text-primary"/>Novas promoções serão publicadas aqui.</CardContent></Card>}</div></main></div>;
}