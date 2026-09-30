create table if not exists public.fidelidade_clientes (
  cliente_id uuid primary key references auth.users(id) on delete cascade,
  pontos integer not null default 0 check (pontos >= 0),
  atendimentos_concluidos integer not null default 0 check (atendimentos_concluidos >= 0),
  atualizado_em timestamptz not null default now()
);
create table if not exists public.fidelidade_movimentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references auth.users(id) on delete cascade,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  pontos integer not null,
  motivo text not null check (char_length(motivo) <= 160),
  criado_em timestamptz not null default now()
);
create table if not exists public.lead_eventos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references auth.users(id) on delete set null,
  sessao text,
  evento text not null check (evento in ('inicio_agendamento','servico_escolhido','barbeiro_escolhido','horario_escolhido','agendamento_confirmado','agendamento_abandonado','whatsapp')),
  dados jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists fidelidade_movimentos_cliente_idx on public.fidelidade_movimentos(cliente_id, criado_em desc);
create index if not exists lead_eventos_criado_idx on public.lead_eventos(criado_em desc);
alter table public.fidelidade_clientes enable row level security;
alter table public.fidelidade_movimentos enable row level security;
alter table public.lead_eventos enable row level security;
create policy "fidelidade_cliente_proprio" on public.fidelidade_clientes for select to authenticated using (cliente_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "fidelidade_movimentos_proprio" on public.fidelidade_movimentos for select to authenticated using (cliente_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "lead_eventos_proprio" on public.lead_eventos for select to authenticated using (cliente_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "lead_eventos_insert" on public.lead_eventos for insert to anon, authenticated with check (cliente_id is null or cliente_id = auth.uid());
create or replace function public.registrar_pontos_agendamento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'concluido' and old.status is distinct from new.status then
    insert into public.fidelidade_clientes(cliente_id,pontos,atendimentos_concluidos)
    values (new.cliente_id,10,1)
    on conflict (cliente_id) do update set pontos=public.fidelidade_clientes.pontos+10, atendimentos_concluidos=public.fidelidade_clientes.atendimentos_concluidos+1, atualizado_em=now();
    insert into public.fidelidade_movimentos(cliente_id,agendamento_id,pontos,motivo) values(new.cliente_id,new.id,10,'Atendimento concluído');
  end if;
  return new;
end;
$$;
revoke all on function public.registrar_pontos_agendamento() from public, anon, authenticated;
create trigger trg_fidelidade_agendamento after update on public.agendamentos for each row execute function public.registrar_pontos_agendamento();