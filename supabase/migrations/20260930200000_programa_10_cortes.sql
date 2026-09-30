alter table public.fidelidade_clientes
  add column if not exists cortes_realizados integer not null default 0 check (cortes_realizados between 0 and 10),
  add column if not exists premio_disponivel boolean not null default false;

alter table public.agendamentos
  add column if not exists beneficio_fidelidade boolean not null default false;

create or replace function public.preparar_agendamento_fidelidade()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  disponivel boolean;
  eh_corte boolean;
begin
  select premio_disponivel into disponivel
  from public.fidelidade_clientes
  where cliente_id = new.cliente_id
  for update;

  select lower(nome) like 'corte%'
    into eh_corte
  from public.servicos
  where id = new.servico_id;

  if coalesce(disponivel,false) and coalesce(eh_corte,false) and new.status <> 'cancelado' then
    new.preco := 0;
    new.beneficio_fidelidade := true;
    update public.fidelidade_clientes
      set premio_disponivel = false, atualizado_em = now()
      where cliente_id = new.cliente_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_preparar_agendamento_fidelidade on public.agendamentos;
create trigger trg_preparar_agendamento_fidelidade
before insert on public.agendamentos
for each row execute function public.preparar_agendamento_fidelidade();

create or replace function public.registrar_corte_fidelidade()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cortes integer;
begin
  if new.status = 'concluido' and old.status is distinct from new.status then
    select cortes_realizados into cortes
    from public.fidelidade_clientes
    where cliente_id = new.cliente_id
    for update;

    if new.beneficio_fidelidade then
      insert into public.fidelidade_clientes(cliente_id,cortes_realizados,premio_disponivel,atendimentos_concluidos)
      values(new.cliente_id,0,false,1)
      on conflict (cliente_id) do update set cortes_realizados=0,premio_disponivel=false,atendimentos_concluidos=public.fidelidade_clientes.atendimentos_concluidos+1,atualizado_em=now();
      insert into public.fidelidade_movimentos(cliente_id,agendamento_id,pontos,motivo)
      values(new.cliente_id,new.id,0,'Corte grátis resgatado — ciclo reiniciado');
    else
      insert into public.fidelidade_clientes(cliente_id,cortes_realizados,premio_disponivel,atendimentos_concluidos)
      values(new.cliente_id,1,false,1)
      on conflict (cliente_id) do update set
        cortes_realizados=least(public.fidelidade_clientes.cortes_realizados+1,10),
        premio_disponivel=(public.fidelidade_clientes.cortes_realizados+1 >= 10),
        atendimentos_concluidos=public.fidelidade_clientes.atendimentos_concluidos+1,
        atualizado_em=now();
      insert into public.fidelidade_movimentos(cliente_id,agendamento_id,pontos,motivo)
      values(new.cliente_id,new.id,1,case when coalesce(cortes,0)+1 >= 10 then '10º corte concluído — próximo corte grátis' else 'Corte concluído' end);
    end if;
  end if;

  if new.status = 'cancelado' and old.status is distinct from new.status and new.beneficio_fidelidade then
    update public.fidelidade_clientes
      set premio_disponivel=true, atualizado_em=now()
      where cliente_id = new.cliente_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_fidelidade_agendamento on public.agendamentos;
create trigger trg_fidelidade_agendamento
after update on public.agendamentos
for each row execute function public.registrar_corte_fidelidade();

revoke all on function public.preparar_agendamento_fidelidade() from public, anon, authenticated;
revoke all on function public.registrar_corte_fidelidade() from public, anon, authenticated;