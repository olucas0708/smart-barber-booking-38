import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarClock, Crown, MessageCircle, Percent, RotateCcw, TrendingUp, UserRound, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { moeda } from "@/lib/barbearia";

export function AdminComercial() {
  const { data: ag=[] } = useQuery({ queryKey:["comercial-ag"], queryFn:async()=>{ const {data,error}=await supabase.from("agendamentos").select("id,cliente_id,inicio,status,preco,servico_id,barbeiro_id,servicos(nome),barbeiros(nome)").limit(1000); if(error) throw error; return data??[]; }});
  const { data: clientes=[] } = useQuery({ queryKey:["comercial-clientes"], queryFn:async()=>{ const {data,error}=await supabase.from("clientes_reativacao" as never).select("*"); if(error) throw error; return (data??[]) as any[]; }});
  const { data: automacoes=[] } = useQuery({ queryKey:["automacoes-comerciais"], queryFn:async()=>{ const {data,error}=await supabase.from("automacoes_comerciais").select("id,cliente_id,tipo,status,agendado_para,mensagem").eq("status","pendente").order("agendado_para").limit(20); if(error) throw error; return data??[]; }});
  const { data: metricas=[] } = useQuery({ queryKey:["metricas-servicos"], queryFn:async()=>{ const {data,error}=await supabase.from("metricas_servicos" as never).select("*").order("receita",{ascending:false}); if(error) throw error; return (data??[]) as any[]; }});
  const concluidos=ag.filter((a:any)=>a.status==="concluido");
  const ticket=concluidos.length?concluidos.reduce((s:number,a:any)=>s+Number(a.preco),0)/concluidos.length:0;
  const noShow=ag.filter((a:any)=>a.status==="nao_compareceu").length;
  const taxaOcupacao=ag.length?Math.round((ag.filter((a:any)=>["confirmado","concluido"].includes(a.status)).length/ag.length)*100):0;
  const reativar=clientes.filter((c:any)=>c.ultimo_atendimento && Date.now()-new Date(c.ultimo_atendimento).getTime()>45*86400000 && c.telefone);
  const ranking=useMemo(()=>metricas.slice(0,5),[metricas]);
  const whatsapp=(telefone:string,nome:string)=>"https://wa.me/"+String(telefone).replace(/\D/g,"")+"?text="+encodeURIComponent("Olá, "+nome+"! Sentimos sua falta na Romario Barber Shop. Quer reservar seu próximo horário?");
  return <section className="mt-6 space-y-5">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card><CardContent className="p-4"><Wallet className="text-primary" size={18}/><p className="mt-2 text-xs text-muted-foreground">Ticket médio</p><p className="font-display text-2xl">{moeda(ticket)}</p></CardContent></Card>
      <Card><CardContent className="p-4"><BarChart3 className="text-primary" size={18}/><p className="mt-2 text-xs text-muted-foreground">Ocupação relativa</p><p className="font-display text-2xl">{taxaOcupacao}%</p></CardContent></Card>
      <Card><CardContent className="p-4"><RotateCcw className="text-primary" size={18}/><p className="mt-2 text-xs text-muted-foreground">No-show</p><p className="font-display text-2xl">{noShow}</p></CardContent></Card>
      <Card><CardContent className="p-4"><Users className="text-primary" size={18}/><p className="mt-2 text-xs text-muted-foreground">Para reativar</p><p className="font-display text-2xl">{reativar.length}</p></CardContent></Card>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp size={19}/> Serviços mais vendidos</CardTitle></CardHeader><CardContent className="space-y-3">
        {ranking.map((s:any,i:number)=><div key={s.id} className="flex items-center justify-between rounded-xl border border-border p-3"><div><p className="font-semibold">{i+1}. {s.nome}</p><p className="text-xs text-muted-foreground">{s.concluidos} concluídos</p></div><span className="font-semibold text-primary">{moeda(Number(s.receita))}</span></div>)}
        {!ranking.length&&<p className="text-sm text-muted-foreground">Ainda não há dados suficientes.</p>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Crown size={19}/> Fidelidade & VIP</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="font-semibold">Clube Romario</p><p className="text-sm text-muted-foreground">10 cortes concluídos → próximo grátis.</p></div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl border p-3"><strong className="block text-lg">VIP</strong>clientes recorrentes</div><div className="rounded-xl border p-3"><strong className="block text-lg">10</strong>cortes</div><div className="rounded-xl border p-3"><strong className="block text-lg">1</strong>prêmio</div></div>
      </CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle size={19}/> Recuperação de clientes</CardTitle></CardHeader><CardContent className="space-y-2">
      {reativar.slice(0,10).map((c:any)=><div key={c.cliente_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-semibold">{c.nome}</p><p className="text-xs text-muted-foreground">Último atendimento: {new Date(c.ultimo_atendimento).toLocaleDateString("pt-BR")}</p></div><Button asChild size="sm"><a href={whatsapp(c.telefone,c.nome)} target="_blank" rel="noreferrer"><MessageCircle/> Reativar</a></Button></div>)}
      {!reativar.length&&<p className="text-sm text-muted-foreground">Nenhum cliente parado há mais de 45 dias.</p>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle size={19}/> WhatsApp & automações</CardTitle></CardHeader><CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">A fila comercial já separa lembretes, pós-atendimento e reativação. Cada ação pode abrir o WhatsApp com a mensagem pronta; envio 100% automático exige conectar uma API oficial.</p>
      {automacoes.slice(0,6).map((a:any)=><div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div><Badge variant="secondary">{a.tipo}</Badge><p className="mt-1 max-w-xl text-xs text-muted-foreground">{a.mensagem}</p></div><Button asChild size="sm"><a href={"https://wa.me/5534992041902?text="+encodeURIComponent(a.mensagem||"Olá!")} target="_blank" rel="noreferrer"><MessageCircle/> Abrir WhatsApp</a></Button></div>)}
      {!automacoes.length&&<p className="text-sm text-muted-foreground">Nenhuma ação pendente no momento.</p>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock size={19}/> Automação preparada</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">O sistema já cria filas para lembrete 24h antes e pedido de avaliação após o atendimento. O envio automático pelo WhatsApp depende da conexão de um provedor/API oficial.</p><div className="mt-3 flex flex-wrap gap-2"><Badge><Percent size={13}/> Promoções</Badge><Badge><UserRound size={13}/> Preferências</Badge><Badge><CalendarClock size={13}/> Lembretes</Badge></div></CardContent></Card>
  </section>;
}