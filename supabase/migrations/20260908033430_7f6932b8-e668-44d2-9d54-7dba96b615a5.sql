create type public.status_pagamento as enum ('pagar_no_local','pago','reembolsado');

alter table public.agendamentos
  add column pagamento_status public.status_pagamento not null default 'pagar_no_local',
  add column pagamento_metodo text check (pagamento_metodo is null or char_length(pagamento_metodo) <= 40);

alter table public.profiles add column foto_url text;

create or replace function public.validar_pagamento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.pagamento_status <> old.pagamento_status then
    if not (public.has_role(auth.uid(),'admin') or old.barbeiro_id = public.meu_barbeiro_id()) then
      raise exception 'Somente a barbearia pode alterar a situacao de pagamento';
    end if;
  end if;
  if tg_op = 'INSERT' and new.pagamento_status <> 'pagar_no_local'
     and not (public.has_role(auth.uid(),'admin') or new.barbeiro_id = public.meu_barbeiro_id()) then
    raise exception 'Novos agendamentos entram como a pagar no local';
  end if;
  return new;
end;
$$;
revoke all on function public.validar_pagamento() from public, anon, authenticated;

create trigger trg_validar_pagamento before insert or update on public.agendamentos
  for each row execute function public.validar_pagamento();