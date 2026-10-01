ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS preco_a_partir boolean NOT NULL DEFAULT false;
ALTER TABLE public.barbeiros ADD COLUMN IF NOT EXISTS cargo text;

CREATE TABLE IF NOT EXISTS public.automacoes_comerciais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  agendado_para timestamptz NOT NULL DEFAULT now(),
  mensagem text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automacoes_comerciais TO authenticated;
GRANT ALL ON public.automacoes_comerciais TO service_role;
ALTER TABLE public.automacoes_comerciais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam automacoes" ON public.automacoes_comerciais
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));