-- Endurece a reserva, a fidelidade e a jornada da Romario Barber Shop.
-- A validação continua no banco mesmo quando alguém tenta contornar a interface.

-- Horário oficial solicitado: segunda 13h-20h; terça a sábado 9h-12h e 13h-20h.
update public.configuracoes
set hora_abertura = '09:00',
    hora_fechamento = '20:00',
    dias_funcionamento = array[1,2,3,4,5,6],
    intervalo_slots_minutos = 30,
    atualizado_em = now()
where id = true;

delete from public.horarios_trabalho h
using public.barbeiros b
where h.barbeiro_id = b.id
  and lower(trim(b.nome)) in ('romario', 'joao paulo', 'lucas', 'davi');

insert into public.horarios_trabalho (barbeiro_id, dia_semana, hora_inicio, hora_fim)
select b.id, 1, '13:00'::time, '20:00'::time
from public.barbeiros b
where lower(trim(b.nome)) in ('romario', 'joao paulo', 'lucas', 'davi') and b.ativo = true;

insert into public.horarios_trabalho (barbeiro_id, dia_semana, hora_inicio, hora_fim)
select b.id, d.dia, d.inicio, d.fim
from public.barbeiros b
cross join (values
  (2, '09:00'::time, '12:00'::time),
  (2, '13:00'::time, '20:00'::time),
  (3, '09:00'::time, '12:00'::time),
  (3, '13:00'::time, '20:00'::time),
  (4, '09:00'::time, '12:00'::time),
  (4, '13:00'::time, '20:00'::time),
  (5, '09:00'::time, '12:00'::time),
  (5, '13:00'::time, '20:00'::time),
  (6, '09:00'::time, '12:00'::time),
  (6, '13:00'::time, '20:00'::time)
) as d(dia, inicio, fim)
where lower(trim(b.nome)) in ('romario', 'joao paulo', 'lucas', 'davi') and b.ativo = true;

-- A primeira trigger normaliza entradas e impede clientes/profissionais de editar
-- campos que não fazem parte da ação permitida. Seu nome faz com que execute
-- antes das triggers de validação e fidelidade (ordem alfabética do PostgreSQL).
create or replace function public.proteger_agendamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin boolean;
  v_staff boolean;
begin
  -- Operações internas via service_role não possuem auth.uid().
  if auth.uid() is null then
    return new;
  end if;

  v_admin := public.has_role(auth.uid(), 'admin');
  v_staff := public.has_role(auth.uid(), 'barbeiro') or public.meu_barbeiro_id() is not null;

  if tg_op = 'INSERT' then
    if v_admin then
      return new;
    end if;

    if v_staff then
      if public.meu_barbeiro_id() is null or new.barbeiro_id is distinct from public.meu_barbeiro_id() then
        raise exception 'Profissional só pode criar agendamento para a própria agenda';
      end if;
      -- Profissionais também não podem inserir reservas já concluídas ou pagas.
      new.status := 'confirmado';
      new.pagamento_status := 'pagar_no_local';
      new.pagamento_metodo := null;
      return new;
    end if;

    if new.cliente_id is distinct from auth.uid() then
      raise exception 'Só é possível criar agendamento para a própria conta';
    end if;

    -- O cliente não pode criar uma reserva já concluída, alterar pagamento ou
    -- escolher o status para contornar as validações da agenda.
    new.status := 'confirmado';
    new.pagamento_status := 'pagar_no_local';
    new.pagamento_metodo := null;
    return new;
  end if;

  if v_admin then
    return new;
  end if;

  if v_staff then
    if public.meu_barbeiro_id() is null or old.barbeiro_id is distinct from public.meu_barbeiro_id() then
      raise exception 'Profissional só pode alterar agendamentos da própria agenda';
    end if;

    if new.cliente_id is distinct from old.cliente_id
      or new.barbeiro_id is distinct from old.barbeiro_id
      or new.servico_id is distinct from old.servico_id
      or new.inicio is distinct from old.inicio
      or new.fim is distinct from old.fim
      or new.preco is distinct from old.preco
      or new.observacoes is distinct from old.observacoes
      or new.beneficio_fidelidade is distinct from old.beneficio_fidelidade
      or new.criado_em is distinct from old.criado_em then
      raise exception 'Profissional não pode alterar os dados comerciais ou o horário da reserva';
    end if;

    if old.status in ('concluido', 'cancelado', 'nao_compareceu')
      and new.status is distinct from old.status then
      raise exception 'Não é permitido reabrir um atendimento encerrado';
    end if;

    if old.status = 'confirmado'
      and new.status not in ('confirmado', 'concluido', 'cancelado', 'nao_compareceu') then
      raise exception 'Transição de status inválida';
    end if;

    if old.status = 'pendente'
      and new.status not in ('pendente', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu') then
      raise exception 'Transição de status inválida';
    end if;
    return new;
  end if;

  if old.cliente_id is distinct from auth.uid()
    or old.status not in ('pendente', 'confirmado')
    or new.status <> 'cancelado' then
    raise exception 'Cliente só pode cancelar a própria reserva pendente ou confirmada';
  end if;

  if new.cliente_id is distinct from old.cliente_id
    or new.barbeiro_id is distinct from old.barbeiro_id
    or new.servico_id is distinct from old.servico_id
    or new.inicio is distinct from old.inicio
    or new.fim is distinct from old.fim
    or new.preco is distinct from old.preco
    or new.observacoes is distinct from old.observacoes
    or new.beneficio_fidelidade is distinct from old.beneficio_fidelidade
    or new.pagamento_status is distinct from old.pagamento_status
    or new.pagamento_metodo is distinct from old.pagamento_metodo
    or new.criado_em is distinct from old.criado_em then
    raise exception 'Cliente não pode alterar preço, pagamento ou dados da reserva';
  end if;

  return new;
end;
$$;

revoke all on function public.proteger_agendamento() from public, anon, authenticated;
drop trigger if exists trg_a_proteger_agendamento on public.agendamentos;
create trigger trg_a_proteger_agendamento
before insert or update on public.agendamentos
for each row execute function public.proteger_agendamento();

-- O preço é sempre lido do catálogo no banco. O benefício só vale para corte
-- simples/máquina, nunca para combos, barba, selagem ou coloração.
create or replace function public.preparar_agendamento_fidelidade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  disponivel boolean := false;
  v_preco numeric(10,2);
  v_nome text;
  eh_corte_simples boolean := false;
begin
  select preco, nome into v_preco, v_nome
  from public.servicos
  where id = new.servico_id and ativo = true;

  if not found then
    raise exception 'Serviço indisponível. Atualize o catálogo e tente novamente.';
  end if;

  select premio_disponivel into disponivel
  from public.fidelidade_clientes
  where cliente_id = new.cliente_id
  for update;

  eh_corte_simples := lower(trim(v_nome)) in (
    'corte',
    'corte só máquina — 1 numeração',
    'corte só máquina 1 numeração',
    'corte so maquina 1 numeração'
  );

  if coalesce(disponivel, false) and eh_corte_simples and new.status <> 'cancelado' then
    new.preco := 0;
    new.beneficio_fidelidade := true;

    update public.fidelidade_clientes
    set premio_disponivel = false, atualizado_em = now()
    where cliente_id = new.cliente_id;
  else
    new.preco := v_preco;
    new.beneficio_fidelidade := false;
  end if;

  return new;
end;
$$;

revoke all on function public.preparar_agendamento_fidelidade() from public, anon, authenticated;

-- Conta cortes elegíveis concluídos, não qualquer serviço concluído.
-- O total de atendimentos continua sendo contabilizado separadamente.
create or replace function public.registrar_corte_fidelidade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cortes integer;
  v_nome text;
  eh_corte_simples boolean := false;
begin
  if new.status = 'concluido' and old.status is distinct from new.status then
    select nome into v_nome
    from public.servicos
    where id = new.servico_id;

    eh_corte_simples := lower(trim(coalesce(v_nome, ''))) in (
      'corte',
      'corte só máquina — 1 numeração',
      'corte só máquina 1 numeração',
      'corte so maquina 1 numeração'
    );

    -- A trigger registrar_pontos_agendamento contabiliza atendimentos_concluídos.
    -- Aqui só garantimos a linha para o ciclo de cortes, sem duplicar esse total.
    insert into public.fidelidade_clientes
      (cliente_id, cortes_realizados, premio_disponivel, atendimentos_concluidos)
    values (new.cliente_id, 0, false, 0)
    on conflict (cliente_id) do nothing;

    if eh_corte_simples and new.beneficio_fidelidade then
      update public.fidelidade_clientes
      set cortes_realizados = 0,
          premio_disponivel = false,
          atualizado_em = now()
      where cliente_id = new.cliente_id;

      insert into public.fidelidade_movimentos (cliente_id, agendamento_id, pontos, motivo)
      values (new.cliente_id, new.id, 0, 'Corte grátis resgatado — ciclo reiniciado');

    elsif eh_corte_simples then
      select cortes_realizados into cortes
      from public.fidelidade_clientes
      where cliente_id = new.cliente_id
      for update;

      update public.fidelidade_clientes
      set cortes_realizados = least(coalesce(cortes, 0) + 1, 10),
          premio_disponivel = (coalesce(cortes, 0) + 1 >= 10),
          atualizado_em = now()
      where cliente_id = new.cliente_id;

      insert into public.fidelidade_movimentos (cliente_id, agendamento_id, pontos, motivo)
      values (
        new.cliente_id,
        new.id,
        1,
        case when coalesce(cortes, 0) + 1 >= 10
          then '10º corte concluído — próximo corte grátis'
          else 'Corte concluído'
        end
      );
    end if;
  end if;

  if new.status = 'cancelado'
    and old.status is distinct from new.status
    and new.beneficio_fidelidade then
    update public.fidelidade_clientes
    set premio_disponivel = true, atualizado_em = now()
    where cliente_id = new.cliente_id;
  end if;

  return new;
end;
$$;

revoke all on function public.registrar_corte_fidelidade() from public, anon, authenticated;

-- Serializa reservas por profissional antes de verificar sobreposição, para que
-- duas transações simultâneas não aprovem o mesmo intervalo.
create or replace function public.validar_agendamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.configuracoes;
  v_dow integer;
  v_recentes integer;
begin
  select * into cfg from public.configuracoes where id = true;
  if not found then
    raise exception 'Configuração da barbearia não encontrada';
  end if;

  if tg_op = 'INSERT' then
    if exists (
      select 1 from public.profiles p
      where p.id = new.cliente_id and p.bloqueado = true
    ) then
      raise exception 'Cliente bloqueado não pode agendar';
    end if;

    if not exists (select 1 from public.servicos s where s.id = new.servico_id and s.ativo = true) then
      raise exception 'Serviço indisponível';
    end if;

    if not exists (select 1 from public.barbeiros b where b.id = new.barbeiro_id and b.ativo = true) then
      raise exception 'Profissional indisponível';
    end if;

    select count(*) into v_recentes
    from public.agendamentos
    where cliente_id = new.cliente_id
      and criado_em > now() - interval '10 minutes';

    if v_recentes >= 5 then
      raise exception 'Muitas tentativas de agendamento. Tente novamente em alguns minutos.';
    end if;

    if new.inicio < now() then
      raise exception 'Não é possível agendar em um horário passado';
    end if;
  end if;

  if new.status in ('confirmado', 'pendente') then
    -- Transações para o mesmo barbeiro entram em fila até concluir a validação.
    perform pg_advisory_xact_lock(hashtextextended(new.barbeiro_id::text, 0));

    v_dow := extract(dow from (new.inicio at time zone 'America/Sao_Paulo'))::integer;
    if not (v_dow = any (cfg.dias_funcionamento)) then
      raise exception 'A barbearia não funciona neste dia';
    end if;

    if not exists (
      select 1
      from public.horarios_trabalho h
      where h.barbeiro_id = new.barbeiro_id
        and h.dia_semana = v_dow
        and (new.inicio at time zone 'America/Sao_Paulo')::time >= h.hora_inicio
        and (new.fim at time zone 'America/Sao_Paulo')::time <= h.hora_fim
    ) then
      raise exception 'Horário fora da jornada de trabalho do barbeiro';
    end if;

    if exists (
      select 1
      from public.bloqueios b
      where b.barbeiro_id = new.barbeiro_id
        and b.data = (new.inicio at time zone 'America/Sao_Paulo')::date
        and b.hora_inicio < (new.fim at time zone 'America/Sao_Paulo')::time
        and b.hora_fim > (new.inicio at time zone 'America/Sao_Paulo')::time
    ) then
      raise exception 'Horário bloqueado na agenda do barbeiro';
    end if;

    if exists (
      select 1
      from public.agendamentos a
      where a.barbeiro_id = new.barbeiro_id
        and a.id <> new.id
        and a.status in ('pendente', 'confirmado', 'concluido')
        and a.inicio < new.fim
        and a.fim > new.inicio
    ) then
      raise exception 'Este horário acabou de ser ocupado. Escolha outro.';
    end if;
  end if;

  if tg_op = 'UPDATE'
    and old.status is distinct from new.status
    and new.status = 'cancelado'
    and not (public.has_role(auth.uid(), 'admin') or old.barbeiro_id = public.meu_barbeiro_id()) then
    if old.inicio - now() < make_interval(hours => cfg.antecedencia_min_cancelamento_horas) then
      raise exception 'Cancelamento fora do prazo mínimo de antecedência';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.validar_agendamento() from public, anon, authenticated;
