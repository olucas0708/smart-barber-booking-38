-- ============ TIPOS ============
create type public.app_role as enum ('cliente','barbeiro','admin');
create type public.status_agendamento as enum ('pendente','confirmado','concluido','cancelado','nao_compareceu');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text,
  telefone text,
  bloqueado boolean not null default false,
  consentimento_lgpd boolean not null default false,
  criado_em timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  criado_em timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ============ BARBEIROS ============
create table public.barbeiros (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references auth.users(id) on delete set null,
  nome text not null,
  foto_url text,
  especialidades text[] not null default '{}',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
grant select on public.barbeiros to anon;
grant select, insert, update, delete on public.barbeiros to authenticated;
grant all on public.barbeiros to service_role;
alter table public.barbeiros enable row level security;

create or replace function public.meu_barbeiro_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.barbeiros where profile_id = auth.uid() limit 1
$$;

-- ============ SERVICOS ============
create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 80),
  descricao text check (descricao is null or char_length(descricao) <= 500),
  duracao_minutos int not null check (duracao_minutos between 5 and 480),
  preco numeric(10,2) not null check (preco >= 0 and preco <= 100000),
  categoria text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
grant select on public.servicos to anon;
grant select, insert, update, delete on public.servicos to authenticated;
grant all on public.servicos to service_role;
alter table public.servicos enable row level security;

-- ============ HORARIOS DE TRABALHO ============
create table public.horarios_trabalho (
  id uuid primary key default gen_random_uuid(),
  barbeiro_id uuid not null references public.barbeiros(id) on delete cascade,
  dia_semana int not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fim time not null,
  check (hora_fim > hora_inicio)
);
grant select on public.horarios_trabalho to anon;
grant select, insert, update, delete on public.horarios_trabalho to authenticated;
grant all on public.horarios_trabalho to service_role;
alter table public.horarios_trabalho enable row level security;

-- ============ BLOQUEIOS ============
create table public.bloqueios (
  id uuid primary key default gen_random_uuid(),
  barbeiro_id uuid not null references public.barbeiros(id) on delete cascade,
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  motivo text check (motivo is null or char_length(motivo) <= 200),
  criado_em timestamptz not null default now(),
  check (hora_fim > hora_inicio)
);
grant select on public.bloqueios to anon;
grant select, insert, update, delete on public.bloqueios to authenticated;
grant all on public.bloqueios to service_role;
alter table public.bloqueios enable row level security;

-- ============ AGENDAMENTOS ============
create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references auth.users(id) on delete cascade,
  barbeiro_id uuid not null references public.barbeiros(id) on delete restrict,
  servico_id uuid not null references public.servicos(id) on delete restrict,
  inicio timestamptz not null,
  fim timestamptz not null,
  status public.status_agendamento not null default 'confirmado',
  preco numeric(10,2) not null default 0,
  observacoes text check (observacoes is null or char_length(observacoes) <= 300),
  criado_em timestamptz not null default now(),
  check (fim > inicio)
);
create index agendamentos_barbeiro_inicio_idx on public.agendamentos (barbeiro_id, inicio);
create index agendamentos_cliente_idx on public.agendamentos (cliente_id, inicio desc);
grant select, insert, update on public.agendamentos to authenticated;
grant all on public.agendamentos to service_role;
alter table public.agendamentos enable row level security;

-- ============ AVALIACOES ============
create table public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  agendamento_id uuid not null unique references public.agendamentos(id) on delete cascade,
  cliente_id uuid not null references auth.users(id) on delete cascade,
  barbeiro_id uuid not null references public.barbeiros(id) on delete cascade,
  nota int not null check (nota between 1 and 5),
  comentario text check (comentario is null or char_length(comentario) <= 500),
  criado_em timestamptz not null default now()
);
grant select on public.avaliacoes to anon;
grant select, insert on public.avaliacoes to authenticated;
grant all on public.avaliacoes to service_role;
alter table public.avaliacoes enable row level security;

create or replace function public.atende_cliente(_cliente uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.agendamentos a
    where a.cliente_id = _cliente and a.barbeiro_id = public.meu_barbeiro_id()
  )
$$;

-- ============ CONFIGURACOES ============
create table public.configuracoes (
  id boolean primary key default true check (id),
  nome text not null default 'Navalha & Ouro',
  hora_abertura time not null default '09:00',
  hora_fechamento time not null default '20:00',
  dias_funcionamento int[] not null default '{1,2,3,4,5,6}',
  antecedencia_min_cancelamento_horas int not null default 2 check (antecedencia_min_cancelamento_horas between 0 and 168),
  intervalo_slots_minutos int not null default 30 check (intervalo_slots_minutos in (10,15,20,30,60)),
  atualizado_em timestamptz not null default now()
);
grant select on public.configuracoes to anon;
grant select, update on public.configuracoes to authenticated;
grant all on public.configuracoes to service_role;
alter table public.configuracoes enable row level security;

-- ============ AUDITORIA ============
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  acao text not null,
  entidade text not null,
  entidade_id text,
  detalhes jsonb,
  criado_em timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;

-- ============ POLICIES ============
create policy "profiles_select_own" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin') or (public.has_role(auth.uid(),'barbeiro') and public.atende_cliente(id)));
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and bloqueado = false);
create policy "profiles_update_admin" on public.profiles for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "roles_select_own" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create policy "barbeiros_select_public" on public.barbeiros for select to anon, authenticated using (true);
create policy "barbeiros_admin_all" on public.barbeiros for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "servicos_select_public" on public.servicos for select to anon, authenticated using (true);
create policy "servicos_admin_all" on public.servicos for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "horarios_select_public" on public.horarios_trabalho for select to anon, authenticated using (true);
create policy "horarios_admin_all" on public.horarios_trabalho for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "bloqueios_select_public" on public.bloqueios for select to anon, authenticated using (true);
create policy "bloqueios_admin_all" on public.bloqueios for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "bloqueios_barbeiro_all" on public.bloqueios for all to authenticated
  using (barbeiro_id = public.meu_barbeiro_id()) with check (barbeiro_id = public.meu_barbeiro_id());

create policy "agendamentos_select" on public.agendamentos for select to authenticated
  using (cliente_id = auth.uid() or barbeiro_id = public.meu_barbeiro_id() or public.has_role(auth.uid(),'admin'));
create policy "agendamentos_insert_cliente" on public.agendamentos for insert to authenticated
  with check (cliente_id = auth.uid());
create policy "agendamentos_insert_staff" on public.agendamentos for insert to authenticated
  with check (public.has_role(auth.uid(),'admin') or barbeiro_id = public.meu_barbeiro_id());
create policy "agendamentos_update_cliente" on public.agendamentos for update to authenticated
  using (cliente_id = auth.uid()) with check (cliente_id = auth.uid());
create policy "agendamentos_update_staff" on public.agendamentos for update to authenticated
  using (public.has_role(auth.uid(),'admin') or barbeiro_id = public.meu_barbeiro_id())
  with check (public.has_role(auth.uid(),'admin') or barbeiro_id = public.meu_barbeiro_id());

create policy "avaliacoes_select_public" on public.avaliacoes for select to anon, authenticated using (true);
create policy "avaliacoes_insert_cliente" on public.avaliacoes for insert to authenticated
  with check (cliente_id = auth.uid() and exists (
    select 1 from public.agendamentos a
    where a.id = agendamento_id and a.cliente_id = auth.uid() and a.status = 'concluido' and a.barbeiro_id = barbeiro_id
  ));

create policy "config_select_public" on public.configuracoes for select to anon, authenticated using (true);
create policy "config_update_admin" on public.configuracoes for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "audit_select_admin" on public.audit_logs for select to authenticated
  using (public.has_role(auth.uid(),'admin'));

-- ============ NOVO USUARIO ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_role public.app_role;
begin
  insert into public.profiles (id, nome, email, telefone, consentimento_lgpd)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(coalesce(new.email,''),'@',1)),
    new.email,
    nullif(new.raw_user_meta_data->>'telefone',''),
    coalesce((new.raw_user_meta_data->>'consentimento_lgpd')::boolean, false)
  )
  on conflict (id) do nothing;

  if exists (select 1 from public.barbeiros b where b.profile_id = new.id) then
    v_role := 'barbeiro';
  elsif not exists (select 1 from public.user_roles) then
    v_role := 'admin';
  else
    v_role := 'cliente';
  end if;

  insert into public.user_roles (user_id, role) values (new.id, v_role)
  on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ VALIDACAO DE AGENDAMENTO ============
create or replace function public.validar_agendamento()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cfg public.configuracoes;
  v_dow int;
  v_recentes int;
begin
  select * into cfg from public.configuracoes where id;

  if tg_op = 'INSERT' then
    if exists (select 1 from public.profiles p where p.id = new.cliente_id and p.bloqueado) then
      raise exception 'Cliente bloqueado nao pode agendar';
    end if;
    -- rate limiting simples: no maximo 5 agendamentos criados em 10 minutos
    select count(*) into v_recentes from public.agendamentos
      where cliente_id = new.cliente_id and criado_em > now() - interval '10 minutes';
    if v_recentes >= 5 then
      raise exception 'Muitas tentativas de agendamento. Tente novamente em alguns minutos.';
    end if;
    if new.inicio < now() then
      raise exception 'Nao e possivel agendar em um horario passado';
    end if;
  end if;

  if new.status in ('confirmado','pendente') then
    v_dow := extract(dow from (new.inicio at time zone 'America/Sao_Paulo'))::int;
    if not (v_dow = any (cfg.dias_funcionamento)) then
      raise exception 'A barbearia nao funciona neste dia';
    end if;
    if not exists (
      select 1 from public.horarios_trabalho h
      where h.barbeiro_id = new.barbeiro_id
        and h.dia_semana = v_dow
        and (new.inicio at time zone 'America/Sao_Paulo')::time >= h.hora_inicio
        and (new.fim at time zone 'America/Sao_Paulo')::time <= h.hora_fim
    ) then
      raise exception 'Horario fora da jornada de trabalho do barbeiro';
    end if;
    if exists (
      select 1 from public.bloqueios b
      where b.barbeiro_id = new.barbeiro_id
        and b.data = (new.inicio at time zone 'America/Sao_Paulo')::date
        and b.hora_inicio < (new.fim at time zone 'America/Sao_Paulo')::time
        and b.hora_fim > (new.inicio at time zone 'America/Sao_Paulo')::time
    ) then
      raise exception 'Horario bloqueado na agenda do barbeiro';
    end if;
    if exists (
      select 1 from public.agendamentos a
      where a.barbeiro_id = new.barbeiro_id
        and a.id <> new.id
        and a.status in ('pendente','confirmado','concluido')
        and a.inicio < new.fim and a.fim > new.inicio
    ) then
      raise exception 'Este horario acabou de ser ocupado. Escolha outro.';
    end if;
  end if;

  if tg_op = 'UPDATE' and old.status <> new.status and new.status = 'cancelado'
     and not (public.has_role(auth.uid(),'admin') or old.barbeiro_id = public.meu_barbeiro_id()) then
    if old.inicio - now() < make_interval(hours => cfg.antecedencia_min_cancelamento_horas) then
      raise exception 'Cancelamento fora do prazo minimo de antecedencia';
    end if;
  end if;

  return new;
end;
$$;
create trigger trg_validar_agendamento before insert or update on public.agendamentos
  for each row execute function public.validar_agendamento();

-- ============ AUDITORIA ============
create or replace function public.registrar_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, acao, entidade, entidade_id, detalhes)
  values (auth.uid(), tg_op, tg_table_name,
    coalesce((case when tg_op = 'DELETE' then to_jsonb(old)->>'id' else to_jsonb(new)->>'id' end), ''),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end);
  return coalesce(new, old);
end;
$$;
create trigger trg_audit_servicos after insert or update or delete on public.servicos
  for each row execute function public.registrar_auditoria();
create trigger trg_audit_barbeiros after insert or update or delete on public.barbeiros
  for each row execute function public.registrar_auditoria();
create trigger trg_audit_config after update on public.configuracoes
  for each row execute function public.registrar_auditoria();

-- ============ DISPONIBILIDADE ============
create or replace function public.horarios_disponiveis(p_barbeiro uuid, p_data date, p_duracao int)
returns setof timestamptz language plpgsql stable security definer set search_path = public as $$
declare
  cfg public.configuracoes;
  v_dow int;
  h record;
  slot timestamptz;
  slot_fim timestamptz;
begin
  select * into cfg from public.configuracoes where id;
  v_dow := extract(dow from p_data)::int;
  if not (v_dow = any (cfg.dias_funcionamento)) then return; end if;
  if p_duracao is null or p_duracao < 5 or p_duracao > 480 then return; end if;

  for h in
    select greatest(hora_inicio, cfg.hora_abertura) as hi, least(hora_fim, cfg.hora_fechamento) as hf
    from public.horarios_trabalho
    where barbeiro_id = p_barbeiro and dia_semana = v_dow
  loop
    if h.hf <= h.hi then continue; end if;
    slot := ((p_data + h.hi) at time zone 'America/Sao_Paulo');
    while slot + make_interval(mins => p_duracao) <= ((p_data + h.hf) at time zone 'America/Sao_Paulo') loop
      slot_fim := slot + make_interval(mins => p_duracao);
      if slot > now()
         and not exists (
           select 1 from public.agendamentos a
           where a.barbeiro_id = p_barbeiro
             and a.status in ('pendente','confirmado','concluido')
             and a.inicio < slot_fim and a.fim > slot)
         and not exists (
           select 1 from public.bloqueios b
           where b.barbeiro_id = p_barbeiro and b.data = p_data
             and b.hora_inicio < (slot_fim at time zone 'America/Sao_Paulo')::time
             and b.hora_fim > (slot at time zone 'America/Sao_Paulo')::time)
      then
        return next slot;
      end if;
      slot := slot + make_interval(mins => cfg.intervalo_slots_minutos);
    end loop;
  end loop;
end;
$$;
grant execute on function public.horarios_disponiveis(uuid, date, int) to anon, authenticated;

-- ============ REALTIME ============
alter publication supabase_realtime add table public.agendamentos;

-- ============ DADOS INICIAIS ============
insert into public.configuracoes (id) values (true);

insert into public.servicos (nome, descricao, duracao_minutos, preco, categoria) values
  ('Corte Clássico','Corte na tesoura e máquina com finalização.',30,45.00,'Cabelo'),
  ('Corte + Barba','Combo completo com toalha quente.',60,80.00,'Combo'),
  ('Barba Terapia','Modelagem de barba com navalha e óleos.',30,40.00,'Barba'),
  ('Degradê Navalhado','Fade preciso finalizado na navalha.',45,60.00,'Cabelo'),
  ('Pezinho','Acabamento rápido de nuca e contornos.',15,20.00,'Cabelo'),
  ('Pigmentação',' Correção de falhas com pigmento.',40,55.00,'Estética');

insert into public.barbeiros (nome, especialidades) values
  ('Rafael Moura', array['Degradê','Navalha']),
  ('Bruno Lima', array['Barba','Tesoura']),
  ('Diego Santos', array['Infantil','Pigmentação']);

insert into public.horarios_trabalho (barbeiro_id, dia_semana, hora_inicio, hora_fim)
select b.id, d, '09:00'::time, '19:00'::time
from public.barbeiros b, generate_series(1,5) d;
insert into public.horarios_trabalho (barbeiro_id, dia_semana, hora_inicio, hora_fim)
select b.id, 6, '09:00'::time, '16:00'::time from public.barbeiros b;