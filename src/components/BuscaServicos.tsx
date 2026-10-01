import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { moeda } from "@/lib/barbearia";

type Servico={id:string;nome:string;descricao:string;duracao_minutos:number;preco:number;categoria:string|null;preco_a_partir:boolean};

export function BuscaServicos({servicos}:{servicos:Servico[]}) {
 const [busca,setBusca]=useState(""); const [categoria,setCategoria]=useState("Todos");
 const categorias=useMemo(()=>["Todos",...Array.from(new Set(servicos.map(s=>s.categoria).filter(Boolean) as string[]))],[servicos]);
 const filtrados=useMemo(()=>{const termos=busca.toLowerCase().trim().split(/\s+/).filter(Boolean);return servicos.filter(s=>{const texto=`${s.nome} ${s.descricao} ${s.categoria??""} ${s.duracao_minutos} minutos`.toLowerCase();return (categoria==="Todos"||s.categoria===categoria)&&termos.every(t=>texto.includes(t));});},[servicos,busca,categoria]);
 return <div>
  <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/><Input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Busque: corte, barba, luzes, sobrancelha..." className="h-11 pl-10"/></div><div className="flex items-center gap-2 overflow-x-auto pb-1"><SlidersHorizontal size={16} className="shrink-0 text-primary"/>{categorias.map(c=><button key={c} type="button" onClick={()=>setCategoria(c)}><Badge variant={categoria===c?"default":"secondary"} className="cursor-pointer whitespace-nowrap">{c}</Badge></button>)}</div></div>
  <p className="mt-3 text-xs text-muted-foreground">{filtrados.length} serviço(s) encontrado(s)</p>
  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtrados.map(s=><Card key={s.id} className="premium-card"><CardContent className="flex min-h-40 h-full flex-col gap-3 p-6"><div className="flex items-start justify-between gap-4"><div>{s.categoria&&<Badge variant="secondary" className="mb-2 rounded-full text-[10px] uppercase tracking-wider">{s.categoria}</Badge>}<h3 className="text-2xl leading-none">{s.nome}</h3></div><span className="whitespace-nowrap text-sm font-semibold text-primary">{s.preco_a_partir?`A partir de: ${moeda(s.preco)}`:moeda(s.preco)}</span></div><p className="text-sm leading-6 text-muted-foreground">{s.descricao}</p><div className="mt-auto text-xs text-muted-foreground">{s.duracao_minutos} min</div></CardContent></Card>)}</div>
  {!filtrados.length&&<Card className="mt-5"><CardContent className="p-8 text-center text-sm text-muted-foreground">Não encontrei esse serviço. Tente outro termo ou fale pelo WhatsApp.</CardContent></Card>}
 </div>;
}
