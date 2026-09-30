-- Expansão comercial Romario Barber Shop: equipe, preferências, promoções e automações
alter table public.barbeiros
  add column if not exists cargo text not null default 'Barbeiro',
  add column if not exists bio text,
  add column if not exists ordem integer not null default 100;

create table if not exists public.preferencias_clientes (
  cliente_id uuid primary key references auth.users(id) on delete cascade,
  barbeiro_preferido_id uuid references public.barbeiros(id) on delete set null,
  servico_preferido_id uuid references public.servicos(id) on delete set null,
  estilo_preferido text,
  observacoes text,
  atualizado_em timestamptz not null default now()
);
alter table public.preferencias_clientes enable row level security;
drop policy if exists "preferencias_proprio" on public.preferencias_clientes;
create policy "preferencias_proprio" on public.preferencias_clientes
  for all to authenticated
  using (cliente_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (cliente_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table if not exists public.promocoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  percentual_desconto numeric(5,2) check (percentual_desconto between 0 and 100),
  preco_promocional numeric(10,2),
  validade_inicio date not null default current_date,
  validade_fim date,
  destaque boolean not null default true,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table public.promocoes enable row level security;
drop policy if exists "promocoes_publicas" on public.promocoes;
create policy "promocoes_publicas" on public.promocoes
  for select to anon, authenticated using (ativo and validade_inicio <= current_date and (validade_fim is null or validade_fim >= current_date));
drop policy if exists "promocoes_admin" on public.promocoes;
create policy "promocoes_admin" on public.promocoes
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.automacoes_comerciais (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references auth.users(id) on delete cascade,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  tipo text not null check (tipo in ('lembrete','pos_atendimento','recuperacao','aniversario','reativacao','abandono')),
  status text not null default 'pendente' check (status in ('pendente','processando','enviado','cancelado','erro')),
  agendado_para timestamptz not null,
  canal text not null default 'whatsapp',
  mensagem text,
  enviado_em timestamptz,
  criado_em timestamptz not null default now()
);
create index if not exists automacoes_status_data_idx on public.automacoes_comerciais(status, agendado_para);
create index if not exists automacoes_cliente_idx on public.automacoes_comerciais(cliente_id, criado_em desc);
alter table public.automacoes_comerciais enable row level security;
drop policy if exists "automacoes_admin" on public.automacoes_comerciais;
create policy "automacoes_admin" on public.automacoes_comerciais
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

create index if not exists agendamentos_status_inicio_idx on public.agendamentos(status, inicio);
create index if not exists agendamentos_servico_status_idx on public.agendamentos(servico_id, status);

-- Catálogo de equipe atual
update public.barbeiros
set ativo = false
where nome not in ('Romario','Joao Paulo','Lucas','Davi');

insert into public.barbeiros (nome, especialidades, cargo, bio, ordem, ativo)
select 'Romario', array['Corte','Barba','Navalha','Pigmentação'], 'Dono · Barbeiro principal',
  'Fundador da Romario Barber Shop e responsável pela experiência da casa.', 1, true
where not exists (select 1 from public.barbeiros where lower(nome) = 'romario');

insert into public.barbeiros (nome, especialidades, cargo, bio, ordem, ativo)
select 'Joao Paulo', array['Corte','Degradê','Barba'], 'Barbeiro', 'Atendimento especializado em cortes e barba.', 2, true
where not exists (select 1 from public.barbeiros where lower(nome) = 'joao paulo');

insert into public.barbeiros (nome, especialidades, cargo, bio, ordem, ativo)
select 'Lucas', array['Corte','Máquina','Barba'], 'Barbeiro', 'Cortes modernos, máquina e finalização.', 3, true
where not exists (select 1 from public.barbeiros where lower(nome) = 'lucas');

insert into public.barbeiros (nome, especialidades, cargo, bio, ordem, ativo)
select 'Davi', array['Corte','Luzes','Platinado','Pigmentação'], 'Barbeiro', 'Especialista em transformações e trabalhos de cor.', 4, true
where not exists (select 1 from public.barbeiros where lower(nome) = 'davi');

update public.barbeiros set ordem = case lower(nome)
  when 'romario' then 1 when 'joao paulo' then 2 when 'lucas' then 3 when 'davi' then 4 else ordem end
where lower(nome) in ('romario','joao paulo','lucas','davi');

-- Jornada padrão para os quatro profissionais, sem duplicar horários existentes.
insert into public.horarios_trabalho (barbeiro_id, dia_semana, hora_inicio, hora_fim)
select b.id, d, '09:00'::time, '19:00'::time
from public.barbeiros b cross join generate_series(1,5) d
where lower(b.nome) in ('romario','joao paulo','lucas','davi')
  and not exists (
    select 1 from public.horarios_trabalho h
    where h.barbeiro_id=b.id and h.dia_semana=d
  );
insert into public.horarios_trabalho (barbeiro_id, dia_semana, hora_inicio, hora_fim)
select b.id, 6, '09:00'::time, '16:00'::time
from public.barbeiros b
where lower(b.nome) in ('romario','joao paulo','lucas','davi')
  and not exists (
    select 1 from public.horarios_trabalho h
    where h.barbeiro_id=b.id and h.dia_semana=6
  );

-- Exemplo inicial de promoção, sem forçar desconto real.
insert into public.promocoes (titulo, descricao, destaque)
select 'Clube Romario', 'A cada 10 cortes concluídos, o próximo corte fica grátis.', true
where not exists (select 1 from public.promocoes where titulo='Clube Romario');

-- Agendamento de lembretes e pós-atendimento para novos/alterados agendamentos.
create or replace function public.criar_automacoes_agendamento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('pendente','confirmado') and (tg_op='INSERT' or old.status is distinct from new.status or old.inicio is distinct from new.inicio) then
    delete from public.automacoes_comerciais
    where agendamento_id=new.id and tipo='lembrete' and status='pendente';
    insert into public.automacoes_comerciais(cliente_id,agendamento_id,tipo,agendado_para,mensagem)
    values(new.cliente_id,new.id,'lembrete',new.inicio-interval '24 hours',
      'Lembrete: seu horário na Romario Barber Shop é amanhã. Responda para confirmar.');
  end if;
  if new.status='concluido' and (tg_op='INSERT' or old.status is distinct from new.status) then
    insert into public.automacoes_comerciais(cliente_id,agendamento_id,tipo,agendado_para,mensagem)
    values(new.cliente_id,new.id,'pos_atendimento',now()+interval '2 hours',
      'Como foi seu atendimento na Romario Barber Shop? Avalie seu barbeiro e conte sua experiência.');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_criar_automacoes_agendamento on public.agendamentos;
create trigger trg_criar_automacoes_agendamento
after insert or update on public.agendamentos
for each row execute function public.criar_automacoes_agendamento();
revoke all on function public.criar_automacoes_agendamento() from public, anon, authenticated;

-- Clientes sem atendimento concluído há 45 dias entram no radar de reativação.
create or replace view public.clientes_reativacao with (security_invoker=true) as
select p.id as cliente_id, p.nome, p.telefone,
       max(a.inicio) filter (where a.status='concluido') as ultimo_atendimento
from public.profiles p
left join public.agendamentos a on a.cliente_id=p.id
group by p.id, p.nome, p.telefone;

grant select on public.clientes_reativacao to authenticated;
grant select on public.metricas_servicos to authenticated;


-- Horário oficial de atendimento da Romario Barber Shop.
-- 0=domingo, 1=segunda, ..., 6=sábado.
-- Substitui a jornada genérica anterior e mantém o intervalo 12:00-13:00.
delete from public.horarios_trabalho
where barbeiro_id in (
  select id from public.barbeiros
  where lower(nome) in ('romario','joao paulo','lucas','davi')
);

insert into public.horarios_trabalho (barbeiro_id, dia_semana, hora_inicio, hora_fim)
select b.id, d.dia, d.inicio::time, d.fim::time
from public.barbeiros b
cross join (values
  (1,'13:00','20:00'),
  (2,'09:00','12:00'),
  (2,'13:00','20:00'),
  (3,'09:00','12:00'),
  (3,'13:00','20:00'),
  (4,'09:00','12:00'),
  (4,'13:00','20:00'),
  (5,'09:00','12:00'),
  (5,'13:00','20:00'),
  (6,'09:00','12:00'),
  (6,'13:00','20:00')
) as d(dia,inicio,fim)
where lower(b.nome) in ('romario','joao paulo','lucas','davi');
