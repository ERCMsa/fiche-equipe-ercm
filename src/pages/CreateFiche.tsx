import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import EquipeCard from "@/components/EquipeCard";
import { createEmptyEquipe, Equipe, Fiche, loadFiches, saveFiches } from "@/lib/data";

export default function CreateFiche() {
  const navigate = useNavigate();
  const [equipes, setEquipes] = useState<Equipe[]>([createEmptyEquipe()]);

  const addEquipe = () => setEquipes((prev) => [...prev, createEmptyEquipe()]);

  const updateEquipe = (index: number, updated: Equipe) => {
    setEquipes((prev) => prev.map((e, i) => (i === index ? updated : e)));
  };

  const removeEquipe = (index: number) => {
    if (equipes.length === 1) return toast.error("Il faut au moins une équipe.");
    setEquipes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const fiche: Fiche = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      equipes,
    };
    const fiches = loadFiches();
    fiches.push(fiche);
    saveFiches(fiches);
    toast.success("Fiche enregistrée avec succès !");
    navigate("/fiches");
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Nouvelle Fiche</h1>
          <p className="text-sm text-muted-foreground mt-1">Créez une fiche d'affectation pour vos équipes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/fiches")}>Voir les fiches</Button>
        </div>
      </div>

      <div className="space-y-4">
        {equipes.map((equipe, i) => (
          <EquipeCard key={equipe.id} equipe={equipe} index={i} onChange={(u) => updateEquipe(i, u)} onRemove={() => removeEquipe(i)} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button variant="outline" onClick={addEquipe} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter une Équipe
        </Button>
        <Button onClick={handleSave} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4" /> Enregistrer la Fiche
        </Button>
      </div>
    </div>
  );
}
