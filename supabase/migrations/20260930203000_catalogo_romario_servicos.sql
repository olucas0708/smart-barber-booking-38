-- Catálogo oficial de serviços da Romario Barber Shop
alter table public.servicos
  add column if not exists preco_a_partir boolean not null default false;

update public.servicos set ativo = false;

insert into public.servicos (nome, descricao, duracao_minutos, preco, categoria, preco_a_partir, ativo) values
  ('Acabamento', 'Acabamento e finalização.', 10, 10.00, 'Cabelo', false, true),
  ('Barba', 'Barba com acabamento profissional.', 30, 30.00, 'Barba', false, true),
  ('Barba + Pigmentação', 'Barba com pigmentação.', 50, 55.00, 'Barba', false, true),
  ('Barba + Acabamento', 'Combo de barba e acabamento.', 30, 40.00, 'Combo', false, true),
  ('Cone Hindu', 'Procedimento com cone hindu.', 20, 25.00, 'Estética', false, true),
  ('Corte', 'Corte masculino com finalização.', 30, 40.00, 'Cabelo', false, true),
  ('Corte + Sobrancelha Navalha', 'Corte com sobrancelha na navalha.', 40, 50.00, 'Combo', false, true),
  ('Corte só máquina — 1 numeração', 'Corte feito somente com máquina em uma numeração.', 20, 30.00, 'Cabelo', false, true),
  ('Corte + Barba + Sobrancelha Navalha', 'Combo completo com corte, barba e sobrancelha na navalha.', 60, 80.00, 'Combo', false, true),
  ('Corte + Barba', 'Combo de corte e barba.', 60, 70.00, 'Combo', false, true),
  ('Corte + Selagem', 'Corte com selagem capilar.', 90, 95.00, 'Cabelo', true, true),
  ('Depilação nasal', 'Remoção de pelos da região nasal.', 10, 15.00, 'Estética', false, true),
  ('Hidratação', 'Hidratação capilar.', 10, 30.00, 'Cabelo', false, true),
  ('Limpeza facial', 'Limpeza e cuidado facial.', 20, 30.00, 'Estética', false, true),
  ('Limpeza nasal', 'Limpeza da região nasal.', 10, 15.00, 'Estética', false, true),
  ('Luzes', 'Iluminação dos fios. Valor pode variar conforme o cabelo e o procedimento.', 150, 150.00, 'Coloração', true, true),
  ('Pigmentação', 'Pigmentação para correção e definição.', 20, 25.00, 'Barba', false, true),
  ('Platinado', 'Transformação para efeito platinado.', 150, 150.00, 'Coloração', false, true),
  ('Raspa cabeça na navalha', 'Raspagem da cabeça com navalha.', 20, 30.00, 'Cabelo', false, true),
  ('Relaxamento Capilar', 'Relaxamento capilar.', 10, 55.00, 'Cabelo', false, true),
  ('Selagem', 'Selagem capilar. Valor pode variar conforme o cabelo.', 60, 55.00, 'Cabelo', true, true),
  ('Sobrancelha navalha', 'Acabamento de sobrancelha com navalha.', 10, 15.00, 'Estética', false, true),
  ('Sobrancelha pinça', 'Design de sobrancelha com pinça.', 30, 35.00, 'Estética', false, true);