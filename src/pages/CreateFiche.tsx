import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Save, CalendarIcon, Upload, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import EquipeCard from "@/components/EquipeCard";
import {
  createEmptyEquipe,
  createEmptyProject,
  Equipe,
  EtatFiche,
  Importance,
  Fiche,
  FicheType,
  ProjectEntry,
  loadFiches,
  loadWorkers,
  saveFiche,
  WorkerRecord,
} from "@/lib/data";

export default function CreateFiche() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as FicheType) || "charpenteMetallique";

  const [ficheType, setFicheType] = useState<FicheType>(initialType);
  const [equipes, setEquipes] = useState<Equipe[]>([createEmptyEquipe()]);
  const [dateFiche, setDateFiche] = useState<Date>(new Date());
  const [projects, setProjects] = useState<ProjectEntry[]>([createEmptyProject()]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [savedFiches, setSavedFiches] = useState<Fiche[]>([]);
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFiches().then(setSavedFiches);
    loadWorkers().then(setWorkers);
  }, []);

  useEffect(() => {
    setFicheType(initialType);
  }, [initialType]);

  const addEquipe = () => setEquipes((p) => [...p, createEmptyEquipe()]);
  const updateEquipe = (i: number, u: Equipe) => setEquipes((p) => p.map((e, j) => (j === i ? u : e)));
  const removeEquipe = (i: number) => {
    if (equipes.length === 1) return toast.error("Il faut au moins une équipe.");
    setEquipes((p) => p.filter((_, j) => j !== i));
  };

  const addProject = () => setProjects((p) => [...p, createEmptyProject()]);
  const updateProject = (i: number, u: Partial<ProjectEntry>) =>
    setProjects((p) => p.map((e, j) => (j === i ? { ...e, ...u } : e)));
  const removeProject = (i: number) => setProjects((p) => p.filter((_, j) => j !== i));

  const handleLoadFiche = (fiche: Fiche) => {
    setFicheType(fiche.ficheType);
    setEquipes(fiche.equipes.map((e) => ({ ...e, id: crypto.randomUUID() })));
    setProjects(
      fiche.projects.length
        ? fiche.projects.map((p) => ({ ...p, id: crypto.randomUUID() }))
        : fiche.nomProjet
        ? [{ id: crypto.randomUUID(), nom: fiche.nomProjet, etat: fiche.etat || "pas_urgent", importance: "non_important" }]
        : [createEmptyProject()]
    );
    if (fiche.dateFiche) setDateFiche(new Date(fiche.dateFiche));
    setLoadDialogOpen(false);
    toast.success("Données chargées.");
  };

  const handleSave = async () => {
    setSaving(true);
    const cleanProjects = projects.filter((p) => p.nom.trim());
    const fiche: Fiche = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateFiche: dateFiche.toISOString(),
      ficheType,
      nomProjet: cleanProjects[0]?.nom || "",
      etat: cleanProjects[0]?.etat || "pas_urgent",
      projects: cleanProjects,
      equipes,
      equipements: [],
    };
    await saveFiche(fiche);
    setSaving(false);
    toast.success("Fiche enregistrée !");
    navigate("/fiches");
  };

  const typeLabel = ficheType === "pieceFinition" ? "Pièce Finition" : "Charpente Métallique";

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
            Nouvelle Fiche — {typeLabel}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Créez une fiche d'affectation</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" /> Charger
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Charger depuis une fiche existante</DialogTitle>
              </DialogHeader>
              {savedFiches.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucune fiche.</p>
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
                          {f.ficheType === "pieceFinition" ? "Pièce Finition" : "Charpente Métallique"} —{" "}
                          {format(new Date(f.dateFiche || f.createdAt), "dd MMM yyyy", { locale: fr })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {f.equipes.length} équipe(s)
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => navigate("/fiches")}>Voir les fiches</Button>
          <Button variant="outline" onClick={() => navigate("/workers")}>Employés</Button>
        </div>
      </div>

      {/* Fiche type + date */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs font-medium text-muted-foreground">Type de fiche</Label>
            <Select value={ficheType} onValueChange={(v) => setFicheType(v as FicheType)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="charpenteMetallique">Charpente Métallique</SelectItem>
                <SelectItem value="pieceFinition">Pièce Finition</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Date de fiche</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[220px] justify-start text-left font-normal h-10")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateFiche, "dd MMMM yyyy", { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFiche} onSelect={(d) => d && setDateFiche(d)} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {equipes.map((equipe, i) => {
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
              workers={workers}
            />
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button variant="outline" onClick={addEquipe} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter une Équipe
        </Button>
      </div>

      {/* End block: multi projects */}
      <Card className="mt-6 border-2">
        <CardHeader>
          <CardTitle className="text-base font-heading">Projets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.map((p, i) => (
            <div key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border-b pb-3 last:border-b-0">
              <div className="md:col-span-5 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nom du projet</Label>
                <Input
                  value={p.nom}
                  onChange={(e) => updateProject(i, { nom: e.target.value })}
                  placeholder="Nom du projet..."
                  className="h-9"
                />
              </div>
              <div className="md:col-span-6 space-y-1.5">
                <Label className="text-xs text-muted-foreground">État</Label>
                <RadioGroup
                  value={p.etat}
                  onValueChange={(v) => updateProject(i, { etat: v as EtatFiche })}
                  className="flex flex-wrap gap-x-6 gap-y-2 min-h-9 items-center"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="urgent" id={`etat-urgent-${p.id}`} />
                    <Label htmlFor={`etat-urgent-${p.id}`} className="cursor-pointer flex items-center gap-1">
                      <span className="text-red-500">🔴</span> Urgent
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pas_urgent" id={`etat-pas-urgent-${p.id}`} />
                    <Label htmlFor={`etat-pas-urgent-${p.id}`} className="cursor-pointer flex items-center gap-1">
                      <span className="text-green-500">🟢</span> Pas urgent
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="important" id={`etat-important-${p.id}`} />
                    <Label htmlFor={`etat-important-${p.id}`} className="cursor-pointer flex items-center gap-1">
                      <span className="text-amber-500">⭐</span> Important
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non_important" id={`etat-non-important-${p.id}`} />
                    <Label htmlFor={`etat-non-important-${p.id}`} className="cursor-pointer flex items-center gap-1">
                      <span className="text-slate-400">⚪</span> Non-Important
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="md:col-span-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProject(i)}
                  className="h-9 w-9 text-destructive"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addProject} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter un projet
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4" /> {saving ? "Enregistrement..." : "Enregistrer la Fiche"}
        </Button>
      </div>
    </div>
  );
}
