
CREATE TABLE public.fiches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_fiche TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.equipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fiche_id UUID NOT NULL REFERENCES public.fiches(id) ON DELETE CASCADE,
  chef_equipe TEXT NOT NULL DEFAULT '',
  monteur1 TEXT NOT NULL DEFAULT '',
  monteur2 TEXT NOT NULL DEFAULT '',
  monteur3 TEXT NOT NULL DEFAULT '',
  ouvrier TEXT NOT NULL DEFAULT '',
  grutier TEXT NOT NULL DEFAULT '',
  projet_now TEXT NOT NULL DEFAULT '',
  projet_future TEXT NOT NULL DEFAULT '',
  date_debut TEXT NOT NULL DEFAULT '',
  date_fin TEXT NOT NULL DEFAULT '',
  manutention TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.fiches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read fiches" ON public.fiches FOR SELECT USING (true);
CREATE POLICY "Public insert fiches" ON public.fiches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update fiches" ON public.fiches FOR UPDATE USING (true);
CREATE POLICY "Public delete fiches" ON public.fiches FOR DELETE USING (true);

CREATE POLICY "Public read equipes" ON public.equipes FOR SELECT USING (true);
CREATE POLICY "Public insert equipes" ON public.equipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update equipes" ON public.equipes FOR UPDATE USING (true);
CREATE POLICY "Public delete equipes" ON public.equipes FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_fiches_updated_at
  BEFORE UPDATE ON public.fiches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
