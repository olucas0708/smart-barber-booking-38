-- Correção definitiva do catálogo informado pelo proprietário.
-- Mantém serviços legados ativos e garante os 24 registros oficiais,
-- preservando inclusive as duas entradas distintas de "luzes".

alter table public.servicos
  add column if not exists preco_a_partir boolean not null default false;

-- Corrige os nomes exatamente como informados, incluindo grafia/capitalização.
update public.servicos set nome='acabamento', duracao_minutos=10, preco=10.00, categoria='Cabelo', preco_a_partir=false, ativo=true where lower(trim(nome))='acabamento';
update public.servicos set nome='barba', duracao_minutos=30, preco=30.00, categoria='Barba', preco_a_partir=false, ativo=true where lower(trim(nome))='barba';
update public.servicos set nome='barba +pigmentação', duracao_minutos=50, preco=55.00, categoria='Barba', preco_a_partir=false, ativo=true where lower(trim(nome)) in ('barba + pigmentação','barba +pigmentação');
update public.servicos set nome='barba+acabamento', duracao_minutos=30, preco=40.00, categoria='Combo', preco_a_partir=false, ativo=true where lower(trim(nome)) in ('barba + acabamento','barba+acabamento');
update public.servicos set nome='cone hindu', duracao_minutos=20, preco=25.00, categoria='Estética', preco_a_partir=false, ativo=true where lower(trim(nome))='cone hindu';
update public.servicos set nome='corte', duracao_minutos=30, preco=40.00, categoria='Cabelo', preco_a_partir=false, ativo=true where lower(trim(nome))='corte';
update public.servicos set nome='corte + sombrancelha navalha', duracao_minutos=40, preco=50.00, categoria='Combo', preco_a_partir=false, ativo=true where lower(trim(nome)) in ('corte + sobrancelha navalha','corte + sombrancelha navalha');
update public.servicos set nome='corte so maquina 1 numeração', duracao_minutos=20, preco=30.00, categoria='Cabelo', preco_a_partir=false, ativo=true where lower(trim(nome)) in ('corte só máquina — 1 numeração','corte so maquina 1 numeração');
update public.servicos set nome='corte+ barba+ sombrancelha navalha', duracao_minutos=60, preco=80.00, categoria='Combo', preco_a_partir=false, ativo=true where lower(trim(nome)) in ('corte + barba + sobrancelha navalha','corte+ barba+ sombrancelha navalha');
update public.servicos set nome='corte+barba', duracao_minutos=60, preco=70.00, categoria='Combo', preco_a_partir=false, ativo=true where lower(trim(nome)) in ('corte + barba','corte+barba');
update public.servicos set nome='corte+selagem', duracao_minutos=90, preco=95.00, categoria='Cabelo', preco_a_partir=true, ativo=true where lower(trim(nome)) in ('corte + selagem','corte+selagem');
update public.servicos set nome='depilação nasal', duracao_minutos=10, preco=15.00, categoria='Estética', preco_a_partir=false, ativo=true where lower(trim(nome))='depilação nasal';
update public.servicos set nome='hidratação', duracao_minutos=10, preco=30.00, categoria='Cabelo', preco_a_partir=false, ativo=true where lower(trim(nome))='hidratação';
update public.servicos set nome='limpeza facial', duracao_minutos=20, preco=30.00, categoria='Estética', preco_a_partir=false, ativo=true where lower(trim(nome))='limpeza facial';
update public.servicos set nome='limpeza nasal', duracao_minutos=10, preco=15.00, categoria='Estética', preco_a_partir=false, ativo=true where lower(trim(nome))='limpeza nasal';
update public.servicos set nome='pigmentação', duracao_minutos=20, preco=25.00, categoria='Barba', preco_a_partir=false, ativo=true where lower(trim(nome))='pigmentação';
update public.servicos set nome='platinado', duracao_minutos=150, preco=150.00, categoria='Coloração', preco_a_partir=false, ativo=true where lower(trim(nome))='platinado';
update public.servicos set nome='Raspa cabeça na navalha', duracao_minutos=20, preco=30.00, categoria='Cabelo', preco_a_partir=false, ativo=true where lower(trim(nome))='raspa cabeça na navalha';
update public.servicos set nome='Relaxamento Capilar', duracao_minutos=10, preco=55.00, categoria='Cabelo', preco_a_partir=false, ativo=true where lower(trim(nome))='relaxamento capilar';
update public.servicos set nome='selagem', duracao_minutos=60, preco=55.00, categoria='Cabelo', preco_a_partir=true, ativo=true where lower(trim(nome))='selagem';
update public.servicos set nome='sombrancelha navalha', duracao_minutos=10, preco=15.00, categoria='Estética', preco_a_partir=false, ativo=true where lower(trim(nome)) in ('sobrancelha navalha','sombrancelha navalha');
update public.servicos set nome='sombrancelha pinça', duracao_minutos=30, preco=35.00, categoria='Estética', preco_a_partir=false, ativo=true where lower(trim(nome)) in ('sobrancelha pinça','sombrancelha pinça');

-- Garante uma "luzes" A partir de e uma "luzes" sem A partir de.
do $$
declare
  id_true uuid;
  id_false uuid;
begin
  select id into id_true from public.servicos
    where lower(trim(nome))='luzes' and ativo=true and preco=150 and duracao_minutos=150
    order by case when preco_a_partir then 0 else 1 end, id limit 1;

  if id_true is null then
    insert into public.servicos (nome, descricao, duracao_minutos, preco, categoria, preco_a_partir, ativo)
    values ('luzes','Iluminação dos fios.',150,150.00,'Coloração',true,true)
    returning id into id_true;
  else
    update public.servicos set nome='luzes', descricao='Iluminação dos fios.', duracao_minutos=150, preco=150.00, categoria='Coloração', preco_a_partir=true, ativo=true where id=id_true;
  end if;

  select id into id_false from public.servicos
    where lower(trim(nome))='luzes' and ativo=true and preco=150 and duracao_minutos=150 and id<>id_true
    order by id limit 1;

  if id_false is null then
    insert into public.servicos (nome, descricao, duracao_minutos, preco, categoria, preco_a_partir, ativo)
    values ('luzes','Iluminação dos fios.',150,150.00,'Coloração',false,true);
  else
    update public.servicos set nome='luzes', descricao='Iluminação dos fios.', duracao_minutos=150, preco=150.00, categoria='Coloração', preco_a_partir=false, ativo=true where id=id_false;
  end if;
end $$;

-- Não remove serviços antigos; apenas garante que os serviços existentes continuem ativos.
update public.servicos set ativo=true;
