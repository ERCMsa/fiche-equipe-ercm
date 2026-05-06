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
  createEmptyEquipement,
  Equipe,
  Equipement,
  EtatFiche,
  Fiche,
  FicheType,
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
  const [equipements, setEquipements] = useState<Equipement[]>([createEmptyEquipement()]);
  const [dateFiche, setDateFiche] = useState<Date>(new Date());
  const [nomProjet, setNomProjet] = useState("");
  const [etat, setEtat] = useState<EtatFiche>("pas_urgent");
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

  const addEquipement = () => setEquipements((p) => [...p, createEmptyEquipement()]);
  const updateEquipement = (i: number, u: Equipement) =>
    setEquipements((p) => p.map((e, j) => (j === i ? u : e)));
  const removeEquipement = (i: number) =>
    setEquipements((p) => (p.length === 1 ? p : p.filter((_, j) => j !== i)));

  const handleLoadFiche = (fiche: Fiche) => {
    setFicheType(fiche.ficheType);
    setEquipes(fiche.equipes.map((e) => ({ ...e, id: crypto.randomUUID() })));
    setEquipements(
      fiche.equipements.length
        ? fiche.equipements.map((e) => ({ ...e, id: crypto.randomUUID() }))
        : [createEmptyEquipement()]
    );
    setNomProjet(fiche.nomProjet || "");
    setEtat(fiche.etat || "pas_urgent");
    if (fiche.dateFiche) setDateFiche(new Date(fiche.dateFiche));
    setLoadDialogOpen(false);
    toast.success("Données chargées.");
  };

  const handleSave = async () => {
    setSaving(true);
    const fiche: Fiche = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateFiche: dateFiche.toISOString(),
      ficheType,
      nomProjet,
      etat,
      equipes: ficheType === "charpenteMetallique" ? equipes : [],
      equipements: ficheType === "pieceFinition" ? equipements : [],
    };
    await saveFiche(fiche);
    setSaving(false);
    toast.success("Fiche enregistrée !");
    navigate("/fiches");
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Nouvelle Fiche</h1>
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
                          {f.ficheType === "pieceFinition"
                            ? `${f.equipements.length} équipement(s)`
                            : `${f.equipes.length} équipe(s)`}
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
                <SelectItem value="pieceFinition">Pièce Finition (Équipement)</SelectItem>
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

      {ficheType === "charpenteMetallique" ? (
        <>
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

          {/* End block: project name + état */}
          <Card className="mt-6 border-2">
            <CardHeader>
              <CardTitle className="text-base font-heading">Informations du projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nom du projet</Label>
                <Input value={nomProjet} onChange={(e) => setNomProjet(e.target.value)} placeholder="Nom du projet..." />
              </div>
              <div className="space-y-2">
                <Label>État</Label>
                <RadioGroup value={etat} onValueChange={(v) => setEtat(v as EtatFiche)} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="urgent" id="etat-urgent" />
                    <Label htmlFor="etat-urgent" className="cursor-pointer flex items-center gap-1">
                      <span className="text-red-500">🔴</span> Urgent
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pas_urgent" id="etat-pas-urgent" />
                    <Label htmlFor="etat-pas-urgent" className="cursor-pointer flex items-center gap-1">
                      <span className="text-green-500">🟢</span> Pas urgent
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Affectation d'équipement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {equipements.map((eq, i) => (
                <div key={eq.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border-b pb-3">
                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Employé</Label>
                    <Select value={eq.workerName || undefined} onValueChange={(v) => updateEquipement(i, { ...eq, workerName: v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                      <SelectContent>
                        {workers.map((w) => (
                          <SelectItem key={w.id} value={w.name}>
                            {w.name}{w.isPrestataire ? " (Prestataire)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-4 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Équipement</Label>
                    <Input value={eq.equipmentName} onChange={(e) => updateEquipement(i, { ...eq, equipmentName: e.target.value })} className="h-9" placeholder="Nom de l'équipement..." />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Quantité</Label>
                    <Input value={eq.quantite} onChange={(e) => updateEquipement(i, { ...eq, quantite: e.target.value })} className="h-9" />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    <Input value={eq.notes} onChange={(e) => updateEquipement(i, { ...eq, notes: e.target.value })} className="h-9" />
                  </div>
                  <div className="md:col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => removeEquipement(i)} className="h-9 w-9 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addEquipement} className="gap-2">
                <Plus className="h-4 w-4" /> Ajouter un équipement
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4" /> {saving ? "Enregistrement..." : "Enregistrer la Fiche"}
        </Button>
      </div>
    </div>
  );
}
