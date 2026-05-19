import { supabase } from "@/integrations/supabase/client";

export type FicheType = "charpenteMetallique" | "pieceFinition";
export type EtatFiche = "urgent" | "pas_urgent";
export type Importance = "important" | "non_important";

export interface WorkerRecord {
  id: string;
  name: string;
  phone: string;
  isPrestataire: boolean;
}

// Default lists kept for fallback (rarely used now — we load from DB)
const DEFAULT_NAMES: string[] = [];

export const WORKERS = {
  chefEquipe: DEFAULT_NAMES,
  monteur: DEFAULT_NAMES,
  ouvrier: DEFAULT_NAMES,
  grutier: DEFAULT_NAMES,
};

export async function loadWorkers(): Promise<WorkerRecord[]> {
  const { data } = await supabase.from("workers").select("*").order("name", { ascending: true });
  return (data || []).map((w: any) => ({
    id: w.id,
    name: w.name,
    phone: w.phone || "",
    isPrestataire: !!w.is_prestataire,
  }));
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

export interface Equipement {
  id: string;
  workerName: string;
  equipmentName: string;
  quantite: string;
  notes: string;
}

export interface ProjectEntry {
  id: string;
  nom: string;
  etat: EtatFiche;
  importance: Importance;
}

export function createEmptyProject(): ProjectEntry {
  return { id: crypto.randomUUID(), nom: "", etat: "pas_urgent", importance: "non_important" };
}

export interface Fiche {
  id: string;
  createdAt: string;
  updatedAt: string;
  dateFiche: string;
  ficheType: FicheType;
  nomProjet: string;
  etat: EtatFiche;
  projects: ProjectEntry[];
  equipes: Equipe[];
  equipements: Equipement[];
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

export function createEmptyEquipement(): Equipement {
  return {
    id: crypto.randomUUID(),
    workerName: "",
    equipmentName: "",
    quantite: "",
    notes: "",
  };
}

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

function dbToEquipement(row: any): Equipement {
  return {
    id: row.id,
    workerName: row.worker_name || "",
    equipmentName: row.equipment_name || "",
    quantite: row.quantite || "",
    notes: row.notes || "",
  };
}

export async function loadFiches(): Promise<Fiche[]> {
  const { data: fichesData, error } = await supabase
    .from("fiches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !fichesData) return [];

  const fiches: Fiche[] = [];
  for (const f of fichesData as any[]) {
    const [{ data: equipesData }, { data: equipementsData }] = await Promise.all([
      supabase.from("equipes").select("*").eq("fiche_id", f.id).order("sort_order", { ascending: true }),
      supabase.from("equipements").select("*").eq("fiche_id", f.id).order("sort_order", { ascending: true }),
    ]);

    fiches.push({
      id: f.id,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
      dateFiche: f.date_fiche,
      ficheType: (f.fiche_type as FicheType) || "charpenteMetallique",
      nomProjet: f.nom_projet || "",
      etat: (f.etat as EtatFiche) || "pas_urgent",
      projects: Array.isArray(f.projects)
        ? (f.projects as any[]).map((p) => ({
            id: p.id || crypto.randomUUID(),
            nom: p.nom || "",
            etat: (p.etat as EtatFiche) || "pas_urgent",
            importance: (p.importance as Importance) || "non_important",
          }))
        : [],
      equipes: (equipesData || []).map(dbToEquipe),
      equipements: (equipementsData || []).map(dbToEquipement),
    });
  }
  return fiches;
}

export async function saveFiche(fiche: Fiche): Promise<void> {
  await supabase.from("fiches").upsert({
    id: fiche.id,
    created_at: fiche.createdAt,
    updated_at: new Date().toISOString(),
    date_fiche: fiche.dateFiche,
    fiche_type: fiche.ficheType,
    nom_projet: fiche.nomProjet,
    etat: fiche.etat,
    projects: fiche.projects as any,
  } as any);

  await supabase.from("equipes").delete().eq("fiche_id", fiche.id);
  await supabase.from("equipements").delete().eq("fiche_id", fiche.id);

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

  if (fiche.equipements.length > 0) {
    const rows = fiche.equipements.map((eq, i) => ({
      id: eq.id,
      fiche_id: fiche.id,
      worker_name: eq.workerName,
      equipment_name: eq.equipmentName,
      quantite: eq.quantite,
      notes: eq.notes,
      sort_order: i,
    }));
    await supabase.from("equipements").insert(rows);
  }
}

export async function deleteFiche(ficheId: string): Promise<void> {
  await supabase.from("fiches").delete().eq("id", ficheId);
}
