import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Copy, Heart, QrCode, Save, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function ClientePlus(){
 const {userId}=useAuth(); const qc=useQueryClient(); const [estilo,setEstilo]=useState(""); const [obs,setObs]=useState("");
 const {data}=useQuery({queryKey:["cliente-plus",userId],enabled:!!userId,queryFn:async()=>{
   const [p,a,f]=await Promise.all([supabase.from("preferencias_clientes" as never).select("*").eq("cliente_id",userId!).maybeSingle(),supabase.from("agendamentos").select("id,status,servico_id,barbeiro_id,inicio,servicos(nome),barbeiros(nome)").eq("cliente_id",userId!).order("inicio",{ascending:false}).limit(50),supabase.from("fidelidade_clientes" as never).select("cortes_realizados,premio_disponivel").eq("cliente_id",userId!).maybeSingle()]);
   if(p.error) throw p.error; if(a.error) throw a.error; if(f.error) throw f.error; return {p:(p.data??{}) as any,a:a.data??[],f:(f.data??{}) as any};
 }});
 const pref=data?.p??{}; const concl=(data?.a??[]).filter((x:any)=>x.status==="concluido").length; const nivel=concl>=20?"Black":concl>=10?"Gold":concl>=5?"Silver":"Start";
 const save=useMutation({mutationFn:async()=>{const {error}=await supabase.from("preferencias_clientes" as never).upsert({cliente_id:userId,estilo_preferido:estilo||pref.estilo_preferido||null,observacoes:obs||pref.observacoes||null,atualizado_em:new Date().toISOString()} as never,{onConflict:"cliente_id"});if(error)throw error;},onSuccess:()=>{toast.success("Meu estilo salvo");qc.invalidateQueries({queryKey:["cliente-plus",userId]});},onError:(e)=>toast.error("Não foi possível salvar", {description:String(e)})});
 const cardUrl=typeof window!=="undefined"?window.location.origin+"/perfil":"https://romariobarbershop.com/perfil"; const qr="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data="+encodeURIComponent(cardUrl);
 return <div className="space-y-5">
  <Card className="overflow-hidden border-primary/20"><CardContent className="p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[.22em] text-primary">Clube Romario</p><h2 className="mt-1 text-3xl">{nivel}</h2><p className="text-sm text-muted-foreground">{concl} atendimentos concluídos · seu estilo fica salvo aqui.</p></div><Crown className="text-primary" size={34}/></div><div className="mt-5 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{width:Math.min(100,(concl%10)*10|| (concl>=10?100:0))+"%"}}/></div></CardContent></Card>
  <Card><CardHeader><CardTitle className="flex items-center gap-2"><Heart size={18}/> Meu estilo</CardTitle></CardHeader><CardContent className="space-y-4">
   <div className="space-y-2"><Label htmlFor="estilo-plus">Preferência de corte/estilo</Label><Input id="estilo-plus" defaultValue={pref.estilo_preferido??""} onChange={e=>setEstilo(e.target.value)} placeholder="Ex.: degradê baixo, barba curta"/></div>
   <div className="space-y-2"><Label htmlFor="obs-plus">Observações para o barbeiro</Label><Textarea id="obs-plus" defaultValue={pref.observacoes??""} onChange={e=>setObs(e.target.value)} maxLength={500} placeholder="Preferências, cuidados ou detalhes importantes"/></div>
   <Button onClick={()=>save.mutate()} disabled={save.isPending}><Save/> Salvar preferências</Button>
  </CardContent></Card>
  <Card><CardHeader><CardTitle className="flex items-center gap-2"><QrCode size={18}/> Cartão digital</CardTitle></CardHeader><CardContent className="flex flex-wrap items-center gap-5"><img src={qr} alt="QR Code do cartão digital" width={150} height={150} className="rounded-xl border p-2"/><div className="space-y-2"><p className="text-sm text-muted-foreground">Abra ou compartilhe seu perfil e acompanhe sua fidelidade pelo celular.</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>navigator.clipboard?.writeText(cardUrl).then(()=>toast.success("Link copiado"))}><Copy/> Copiar</Button><Button variant="outline" onClick={async()=>{try{if(navigator.share){await navigator.share({title:"Meu cartão Romario",url:cardUrl});}else{await navigator.clipboard?.writeText(cardUrl);toast.success("Link copiado");}}catch{}}}><Share2/> Compartilhar</Button></div></div></CardContent></Card>
 </div>;
}