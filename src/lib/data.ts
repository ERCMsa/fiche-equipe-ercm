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

export function loadFiches(): Fiche[] {
  try {
    const data = localStorage.getItem("fiches");
    if (!data) return [];
    const fiches: Fiche[] = JSON.parse(data);
    // Migration: add dateFiche if missing
    return fiches.map((f) => ({
      ...f,
      dateFiche: f.dateFiche || f.createdAt,
    }));
  } catch {
    return [];
  }
}

export function saveFiches(fiches: Fiche[]) {
  localStorage.setItem("fiches", JSON.stringify(fiches));
}
