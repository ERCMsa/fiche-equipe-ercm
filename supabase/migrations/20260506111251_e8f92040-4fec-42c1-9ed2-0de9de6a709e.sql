-- Add prestataire flag to workers
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS is_prestataire boolean NOT NULL DEFAULT false;

-- Add fiche type and end-block info to fiches
ALTER TABLE public.fiches ADD COLUMN IF NOT EXISTS fiche_type text NOT NULL DEFAULT 'charpenteMetallique';
ALTER TABLE public.fiches ADD COLUMN IF NOT EXISTS nom_projet text NOT NULL DEFAULT '';
ALTER TABLE public.fiches ADD COLUMN IF NOT EXISTS etat text NOT NULL DEFAULT 'pas_urgent';

-- Equipment assignments for pieceFinition fiches
CREATE TABLE IF NOT EXISTS public.equipements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id uuid NOT NULL,
  worker_name text NOT NULL DEFAULT '',
  equipment_name text NOT NULL DEFAULT '',
  quantite text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read equipements" ON public.equipements FOR SELECT USING (true);
CREATE POLICY "Public insert equipements" ON public.equipements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update equipements" ON public.equipements FOR UPDATE USING (true);
CREATE POLICY "Public delete equipements" ON public.equipements FOR DELETE USING (true);