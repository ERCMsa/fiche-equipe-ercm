import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Save, CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import EquipeCard from "@/components/EquipeCard";
import { createEmptyEquipe, Equipe, Fiche, loadFiches, saveFiche } from "@/lib/data";

export default function CreateFiche() {
  const navigate = useNavigate();
  const [equipes, setEquipes] = useState<Equipe[]>([createEmptyEquipe()]);
  const [dateFiche, setDateFiche] = useState<Date>(new Date());
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [savedFiches, setSavedFiches] = useState<Fiche[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFiches().then(setSavedFiches);
  }, []);

  const addEquipe = () => setEquipes((prev) => [...prev, createEmptyEquipe()]);

  const updateEquipe = (index: number, updated: Equipe) => {
    setEquipes((prev) => prev.map((e, i) => (i === index ? updated : e)));
  };

  const removeEquipe = (index: number) => {
    if (equipes.length === 1) return toast.error("Il faut au moins une équipe.");
    setEquipes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoadFiche = (fiche: Fiche) => {
    const loadedEquipes = fiche.equipes.map((eq) => ({
      ...eq,
      id: crypto.randomUUID(),
    }));
    setEquipes(loadedEquipes);
    if (fiche.dateFiche) setDateFiche(new Date(fiche.dateFiche));
    setLoadDialogOpen(false);
    toast.success("Données chargées depuis la fiche sélectionnée.");
  };

  const handleSave = async () => {
    setSaving(true);
    const fiche: Fiche = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateFiche: dateFiche.toISOString(),
      equipes,
    };
    await saveFiche(fiche);
    setSaving(false);
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
          <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" /> Charger une fiche
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Charger depuis une fiche existante</DialogTitle>
              </DialogHeader>
              {savedFiches.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucune fiche enregistrée.</p>
              ) : (
                <div className="space-y-2">
                  {savedFiches.map((f) => (
                    <Button
                      key={f.id}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => handleLoadFiche(f)}
                    >
                      <div>
                        <div className="font-medium">
                          Fiche du {format(new Date(f.dateFiche || f.createdAt), "dd MMMM yyyy", { locale: fr })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {f.equipes.length} équipe{f.equipes.length !== 1 ? "s" : ""} — Créée le{" "}
                          {format(new Date(f.createdAt), "dd/MM/yyyy", { locale: fr })}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => navigate("/fiches")}>Voir les fiches</Button>
        </div>
      </div>

      {/* Date de fiche */}
      <div className="mb-6 flex items-center gap-4">
        <Label className="text-sm font-medium">Date de fiche :</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateFiche, "dd MMMM yyyy", { locale: fr })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFiche} onSelect={(d) => d && setDateFiche(d)} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-4">
        {equipes.map((equipe, i) => {
          // Names taken by OTHER teams (current team handled inside EquipeCard).
          const takenByOthers = equipes
            .filter((_, j) => j !== i)
            .flatMap((e) => [e.chefEquipe, e.monteur1, e.monteur2, e.monteur3, e.ouvrier, e.grutier])
            .filter(Boolean);
          return (
            <EquipeCard
              key={equipe.id}
              equipe={equipe}
              index={i}
              onChange={(u) => updateEquipe(i, u)}
              onRemove={() => removeEquipe(i)}
              takenNames={takenByOthers}
            />
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button variant="outline" onClick={addEquipe} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter une Équipe
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4" /> {saving ? "Enregistrement..." : "Enregistrer la Fiche"}
        </Button>
      </div>
    </div>
  );
}
