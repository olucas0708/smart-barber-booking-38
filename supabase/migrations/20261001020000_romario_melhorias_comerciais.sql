create index if not exists agendamentos_cliente_inicio_idx on public.agendamentos(cliente_id, inicio desc);
create index if not exists avaliacoes_barbeiro_criado_idx on public.avaliacoes(barbeiro_id, criado_em desc);

create or replace function public.criar_reativacoes_45_dias()
returns integer language plpgsql security definer set search_path=public as $$
declare total integer;
begin
 insert into public.automacoes_comerciais(cliente_id,tipo,agendado_para,mensagem)
 select r.cliente_id,'reativacao',now(),'Olá, '||coalesce(r.nome,'')||'! Sentimos sua falta na Romario Barber Shop. Quer reservar seu próximo horário?'
 from public.clientes_reativacao r
 where r.telefone is not null and r.ultimo_atendimento is not null
   and r.ultimo_atendimento < now()-interval '45 days'
   and not exists (select 1 from public.automacoes_comerciais a where a.cliente_id=r.cliente_id and a.tipo='reativacao' and a.criado_em > now()-interval '45 days' and a.status in ('pendente','enviado'));
 get diagnostics total = row_count; return total;
end;
$$;
revoke all on function public.criar_reativacoes_45_dias() from public, anon, authenticated;
