// Predefined worker lists
export const WORKERS = {
  chefEquipe: ["Ahmed B.", "Karim L.", "Youssef M.", "Hassan T.", "Omar S.", "Rachid D."],
  monteur: ["Ali K.", "Mehdi R.", "Samir N.", "Farid H.", "Nabil Z.", "Tarik O.", "Jamal F.", "Mourad A."],
  ouvrier: ["Brahim C.", "Driss E.", "Khalid G.", "Amine P.", "Hamid V.", "Fouad W.", "Salim X.", "Aziz Y."],
  grutier: ["Mostafa I.", "Abdel J.", "Redouane Q.", "Hicham U.", "Badr L.", "Zineb M."],
};

export interface Equipe {
  id: string;
  chefEquipe: string;
  monteur1: string;
  monteur2: string;
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
  equipes: Equipe[];
}

export function createEmptyEquipe(): Equipe {
  return {
    id: crypto.randomUUID(),
    chefEquipe: "",
    monteur1: "",
    monteur2: "",
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
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveFiches(fiches: Fiche[]) {
  localStorage.setItem("fiches", JSON.stringify(fiches));
}
