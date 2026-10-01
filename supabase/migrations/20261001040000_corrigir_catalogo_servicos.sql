-- Correção do catálogo oficial da Romario Barber Shop
-- Não desativa nem remove serviços existentes.
-- Apenas corrige os serviços informados pelo proprietário e cadastra os que estiverem ausentes.

alter table public.servicos
  add column if not exists preco_a_partir boolean not null default false;

-- Corrige os serviços oficiais existentes pelo nome.
update public.servicos set duracao_minutos = 10, preco = 10.00, categoria = 'Cabelo', preco_a_partir = false
where lower(trim(nome)) = 'acabamento';

update public.servicos set duracao_minutos = 30, preco = 30.00, categoria = 'Barba', preco_a_partir = false
where lower(trim(nome)) = 'barba';

update public.servicos set duracao_minutos = 50, preco = 55.00, categoria = 'Barba', preco_a_partir = false
where lower(trim(nome)) = 'barba + pigmentação';

update public.servicos set duracao_minutos = 30, preco = 40.00, categoria = 'Combo', preco_a_partir = false
where lower(trim(nome)) = 'barba + acabamento';

update public.servicos set duracao_minutos = 20, preco = 25.00, categoria = 'Estética', preco_a_partir = false
where lower(trim(nome)) = 'cone hindu';

update public.servicos set duracao_minutos = 30, preco = 40.00, categoria = 'Cabelo', preco_a_partir = false
where lower(trim(nome)) = 'corte';

update public.servicos set duracao_minutos = 40, preco = 50.00, categoria = 'Combo', preco_a_partir = false
where lower(trim(nome)) = 'corte + sobrancelha navalha';

update public.servicos set duracao_minutos = 20, preco = 30.00, categoria = 'Cabelo', preco_a_partir = false
where lower(trim(nome)) = 'corte só máquina — 1 numeração';

update public.servicos set duracao_minutos = 60, preco = 80.00, categoria = 'Combo', preco_a_partir = false
where lower(trim(nome)) = 'corte + barba + sobrancelha navalha';

update public.servicos set duracao_minutos = 60, preco = 70.00, categoria = 'Combo', preco_a_partir = false
where lower(trim(nome)) = 'corte + barba';

update public.servicos set duracao_minutos = 90, preco = 95.00, categoria = 'Cabelo', preco_a_partir = true
where lower(trim(nome)) = 'corte + selagem';

update public.servicos set duracao_minutos = 10, preco = 15.00, categoria = 'Estética', preco_a_partir = false
where lower(trim(nome)) = 'depilação nasal';

update public.servicos set duracao_minutos = 10, preco = 30.00, categoria = 'Cabelo', preco_a_partir = false
where lower(trim(nome)) = 'hidratação';

update public.servicos set duracao_minutos = 20, preco = 30.00, categoria = 'Estética', preco_a_partir = false
where lower(trim(nome)) = 'limpeza facial';

update public.servicos set duracao_minutos = 10, preco = 15.00, categoria = 'Estética', preco_a_partir = false
where lower(trim(nome)) = 'limpeza nasal';

update public.servicos set duracao_minutos = 150, preco = 150.00, categoria = 'Coloração', preco_a_partir = true
where lower(trim(nome)) = 'luzes';

update public.servicos set duracao_minutos = 20, preco = 25.00, categoria = 'Barba', preco_a_partir = false
where lower(trim(nome)) = 'pigmentação';

update public.servicos set duracao_minutos = 150, preco = 150.00, categoria = 'Coloração', preco_a_partir = false
where lower(trim(nome)) = 'platinado';

update public.servicos set duracao_minutos = 20, preco = 30.00, categoria = 'Cabelo', preco_a_partir = false
where lower(trim(nome)) = 'raspa cabeça na navalha';

update public.servicos set duracao_minutos = 10, preco = 55.00, categoria = 'Cabelo', preco_a_partir = false
where lower(trim(nome)) = 'relaxamento capilar';

update public.servicos set duracao_minutos = 60, preco = 55.00, categoria = 'Cabelo', preco_a_partir = true
where lower(trim(nome)) = 'selagem';

update public.servicos set duracao_minutos = 10, preco = 15.00, categoria = 'Estética', preco_a_partir = false
where lower(trim(nome)) = 'sobrancelha navalha';

update public.servicos set duracao_minutos = 30, preco = 35.00, categoria = 'Estética', preco_a_partir = false
where lower(trim(nome)) = 'sobrancelha pinça';

-- Cadastra os serviços oficiais caso ainda não existam.
insert into public.servicos (nome, descricao, duracao_minutos, preco, categoria, preco_a_partir, ativo)
select v.nome, v.descricao, v.duracao_minutos, v.preco, v.categoria, v.preco_a_partir, true
from (values
  ('Acabamento','Acabamento e finalização.',10,10.00,'Cabelo',false),
  ('Barba','Barba com acabamento profissional.',30,30.00,'Barba',false),
  ('Barba + Pigmentação','Barba com pigmentação.',50,55.00,'Barba',false),
  ('Barba + Acabamento','Combo de barba e acabamento.',30,40.00,'Combo',false),
  ('Cone Hindu','Procedimento com cone hindu.',20,25.00,'Estética',false),
  ('Corte','Corte masculino com finalização.',30,40.00,'Cabelo',false),
  ('Corte + Sobrancelha Navalha','Corte com sobrancelha na navalha.',40,50.00,'Combo',false),
  ('Corte só máquina — 1 numeração','Corte feito somente com máquina em uma numeração.',20,30.00,'Cabelo',false),
  ('Corte + Barba + Sobrancelha Navalha','Combo completo com corte, barba e sobrancelha na navalha.',60,80.00,'Combo',false),
  ('Corte + Barba','Combo de corte e barba.',60,70.00,'Combo',false),
  ('Corte + Selagem','Corte com selagem capilar.',90,95.00,'Cabelo',true),
  ('Depilação nasal','Remoção de pelos da região nasal.',10,15.00,'Estética',false),
  ('Hidratação','Hidratação capilar.',10,30.00,'Cabelo',false),
  ('Limpeza facial','Limpeza e cuidado facial.',20,30.00,'Estética',false),
  ('Limpeza nasal','Limpeza da região nasal.',10,15.00,'Estética',false),
  ('Luzes','Iluminação dos fios.',150,150.00,'Coloração',true),
  ('Pigmentação','Pigmentação para correção e definição.',20,25.00,'Barba',false),
  ('Platinado','Transformação para efeito platinado.',150,150.00,'Coloração',false),
  ('Raspa cabeça na navalha','Raspagem da cabeça com navalha.',20,30.00,'Cabelo',false),
  ('Relaxamento Capilar','Relaxamento capilar.',10,55.00,'Cabelo',false),
  ('Selagem','Selagem capilar.',60,55.00,'Cabelo',true),
  ('Sobrancelha navalha','Acabamento de sobrancelha com navalha.',10,15.00,'Estética',false),
  ('Sobrancelha pinça','Design de sobrancelha com pinça.',30,35.00,'Estética',false)
) as v(nome,descricao,duracao_minutos,preco,categoria,preco_a_partir)
where not exists (
  select 1 from public.servicos s where lower(trim(s.nome)) = lower(trim(v.nome))
);

-- Garante que nenhum serviço oficial fique desativado por engano.
update public.servicos
set ativo = true
where lower(trim(nome)) in (
  'acabamento','barba','barba + pigmentação','barba + acabamento','cone hindu',
  'corte','corte + sobrancelha navalha','corte só máquina — 1 numeração',
  'corte + barba + sobrancelha navalha','corte + barba','corte + selagem',
  'depilação nasal','hidratação','limpeza facial','limpeza nasal','luzes',
  'pigmentação','platinado','raspa cabeça na navalha','relaxamento capilar',
  'selagem','sobrancelha navalha','sobrancelha pinça'
);
