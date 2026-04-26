import { supabase } from "@/integrations/supabase/client";

// Predefined worker lists
const allEmployeeNames = [
    'ABDELHAK ABDELMALEK',
    'ALLOUCHE ZAKARIA',
    'BAHRI AMIR',
    'BAYA CHEMS ADDINE',
    'BENHAFFAF SMAIL',
    'BOUAZZOUZ EL HOCINE',
    'BOUKHALFA MOUSSA',
    'DJEDID ALI',
    'DOUDAH FERHAT',
    'GALOUL DJAMEL',
    'GHARBI MEHDI',
    'GUETTACHE ABDELHEQ',
    'KACEL OUSSAMA',
    'KEMITI MOHAMED',
    'KOUADRI ADEL',
    'LAMRIBEN MAKHLOUF-HAKIM',
    'MELLAH MUSTAPHA',
    'MISSIOURI RABAH',
    'MIZAB AHMED',
    'MOKRANI SAID',
    'MOUSSAOUI ABDERAOUF',
    'SAIB MOHAMMED EL AMIN',
    'SAIDOUN TAREK',
    'SAIDOUN ABDERRAHIM',
    'SAILAA FOUED',
    'TOUATI MOHAMED AMINE',
    'TOUTAH RACHID',
    'ZIROUR MOHAMMED AMINE',
    'HAMOUDI WALID',
    'HAMOUDI AHMED',
    'KHALED',
    'MOUSSAOUI OMAR',
]

export const WORKERS = {
    chefEquipe: allEmployeeNames,
    monteur: allEmployeeNames,
    ouvrier: allEmployeeNames,
    grutier: allEmployeeNames,
}

export interface Equipe {
  id: string;
  chefEquipe: string;
  monteur1: string;
  monteur2: string;
  monteur3: string;
  ouvrier: string;
  grutier: string;
  projetNow: string;
  projetFuture: string;
  dateDebut: string;
  dateFin: string;
  manutention: string;
}

export interface Fiche {
  id: string;
  createdAt: string;
  updatedAt: string;
  dateFiche: string;
  equipes: Equipe[];
}

export function createEmptyEquipe(): Equipe {
  return {
    id: crypto.randomUUID(),
    chefEquipe: "",
    monteur1: "",
    monteur2: "",
    monteur3: "",
    ouvrier: "",
    grutier: "",
    projetNow: "",
    projetFuture: "",
    dateDebut: "",
    dateFin: "",
    manutention: "",
  };
}

// Convert DB row to Equipe
function dbToEquipe(row: any): Equipe {
  return {
    id: row.id,
    chefEquipe: row.chef_equipe,
    monteur1: row.monteur1,
    monteur2: row.monteur2,
    monteur3: row.monteur3,
    ouvrier: row.ouvrier,
    grutier: row.grutier,
    projetNow: row.projet_now,
    projetFuture: row.projet_future,
    dateDebut: row.date_debut,
    dateFin: row.date_fin,
    manutention: row.manutention,
  };
}

export async function loadFiches(): Promise<Fiche[]> {
  const { data: fichesData, error } = await supabase
    .from("fiches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !fichesData) return [];

  const fiches: Fiche[] = [];
  for (const f of fichesData) {
    const { data: equipesData } = await supabase
      .from("equipes")
      .select("*")
      .eq("fiche_id", f.id)
      .order("sort_order", { ascending: true });

    fiches.push({
      id: f.id,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
      dateFiche: f.date_fiche,
      equipes: (equipesData || []).map(dbToEquipe),
    });
  }
  return fiches;
}

export async function saveFiche(fiche: Fiche): Promise<void> {
  // Upsert fiche
  await supabase.from("fiches").upsert({
    id: fiche.id,
    created_at: fiche.createdAt,
    updated_at: new Date().toISOString(),
    date_fiche: fiche.dateFiche,
  });

  // Delete old equipes for this fiche, then re-insert
  await supabase.from("equipes").delete().eq("fiche_id", fiche.id);

  if (fiche.equipes.length > 0) {
    const rows = fiche.equipes.map((eq, i) => ({
      id: eq.id,
      fiche_id: fiche.id,
      chef_equipe: eq.chefEquipe,
      monteur1: eq.monteur1,
      monteur2: eq.monteur2,
      monteur3: eq.monteur3,
      ouvrier: eq.ouvrier,
      grutier: eq.grutier,
      projet_now: eq.projetNow,
      projet_future: eq.projetFuture,
      date_debut: eq.dateDebut,
      date_fin: eq.dateFin,
      manutention: eq.manutention,
      sort_order: i,
    }));
    await supabase.from("equipes").insert(rows);
  }
}

export async function deleteFiche(ficheId: string): Promise<void> {
  await supabase.from("fiches").delete().eq("id", ficheId);
}
