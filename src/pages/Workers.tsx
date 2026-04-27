import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Pencil, Phone, User, ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadFiches, Fiche, Equipe } from "@/lib/data";

interface Worker {
  id: string;
  name: string;
  phone: string;
}

const ROLE_LABELS: Record<keyof Pick<Equipe, "chefEquipe" | "monteur1" | "monteur2" | "monteur3" | "ouvrier" | "grutier">, string> = {
  chefEquipe: "Chef d'équipe",
  monteur1: "Monteur 1",
  monteur2: "Monteur 2",
  monteur3: "Monteur 3",
  ouvrier: "Ouvrier",
  grutier: "Grutier",
};

const ROLE_KEYS = Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[];

interface WorkerStat {
  ficheId: string;
  ficheDate: string;
  projetNow: string;
  projetFuture: string;
  dateDebut: string;
  dateFin: string;
  role: string;
  chefEquipe: string;
  teammates: string[];
}

export default function Workers() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");

  // Stats dialog
  const [statsWorker, setStatsWorker] = useState<Worker | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [workersRes, fichesRes] = await Promise.all([
      supabase.from("workers").select("*").order("name", { ascending: true }),
      loadFiches(),
    ]);
    if (workersRes.data) setWorkers(workersRes.data as Worker[]);
    setFiches(fichesRes);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openAdd = () => {
    setEditingWorker(null);
    setFormName("");
    setFormPhone("");
    setEditDialogOpen(true);
  };

  const openEdit = (w: Worker) => {
    setEditingWorker(w);
    setFormName(w.name);
    setFormPhone(w.phone);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    const name = formName.trim();
    const phone = formPhone.trim();
    if (!name) {
      toast.error("Le nom est obligatoire.");
      return;
    }
    if (editingWorker) {
      const { error } = await supabase
        .from("workers")
        .update({ name, phone })
        .eq("id", editingWorker.id);
      if (error) {
        toast.error("Erreur lors de la mise à jour.");
        return;
      }
      toast.success("Employé mis à jour.");
    } else {
      const { error } = await supabase.from("workers").insert({ name, phone });
      if (error) {
        toast.error(
          error.message.includes("duplicate")
            ? "Un employé avec ce nom existe déjà."
            : "Erreur lors de l'ajout."
        );
        return;
      }
      toast.success("Employé ajouté.");
    }
    setEditDialogOpen(false);
    fetchAll();
  };

  // Compute statistics for a given worker
  const workerStats = useMemo<WorkerStat[]>(() => {
    if (!statsWorker) return [];
    const name = statsWorker.name;
    const stats: WorkerStat[] = [];
    for (const fiche of fiches) {
      for (const eq of fiche.equipes) {
        const matchedRoles = ROLE_KEYS.filter((k) => eq[k] === name);
        if (matchedRoles.length === 0) continue;
        const teammates = ROLE_KEYS
          .filter((k) => eq[k] && eq[k] !== name)
          .map((k) => `${ROLE_LABELS[k]}: ${eq[k]}`);
        for (const role of matchedRoles) {
          stats.push({
            ficheId: fiche.id,
            ficheDate: fiche.dateFiche || fiche.createdAt,
            projetNow: eq.projetNow,
            projetFuture: eq.projetFuture,
            dateDebut: eq.dateDebut,
            dateFin: eq.dateFin,
            role: ROLE_LABELS[role],
            chefEquipe: eq.chefEquipe,
            teammates,
          });
        }
      }
    }
    // Sort by fiche date desc
    return stats.sort((a, b) => (b.ficheDate || "").localeCompare(a.ficheDate || ""));
  }, [statsWorker, fiches]);

  const projectsCount = useMemo(() => {
    const set = new Set<string>();
    workerStats.forEach((s) => s.projetNow && set.add(s.projetNow));
    return set.size;
  }, [workerStats]);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
            Employés
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {workers.length} employé{workers.length !== 1 ? "s" : ""} enregistré
            {workers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter un employé
          </Button>
        </div>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-muted-foreground py-16">Chargement...</p>
          ) : workers.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">
              Aucun employé.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead className="w-[160px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((w) => (
                  <TableRow
                    key={w.id}
                    className="cursor-pointer"
                    onClick={() => setStatsWorker(w)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {w.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {w.phone ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {w.phone}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Non renseigné
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatsWorker(w);
                        }}
                        className="gap-1"
                      >
                        <BarChart3 className="h-3.5 w-3.5" /> Stats
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(w);
                        }}
                        className="gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWorker ? "Modifier l'employé" : "Ajouter un employé"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="worker-name">Nom complet</Label>
              <Input
                id="worker-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="NOM PRÉNOM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="worker-phone">Téléphone</Label>
              <Input
                id="worker-phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+213 ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              {editingWorker ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats dialog */}
      <Dialog
        open={!!statsWorker}
        onOpenChange={(o) => !o && setStatsWorker(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {statsWorker?.name}
            </DialogTitle>
            {statsWorker?.phone && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> {statsWorker.phone}
              </p>
            )}
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  Affectations totales
                </div>
                <div className="text-2xl font-bold font-heading">
                  {workerStats.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  Projets distincts
                </div>
                <div className="text-2xl font-bold font-heading">
                  {projectsCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  Fiches concernées
                </div>
                <div className="text-2xl font-bold font-heading">
                  {new Set(workerStats.map((s) => s.ficheId)).size}
                </div>
              </CardContent>
            </Card>
          </div>

          {workerStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune affectation trouvée pour cet employé.
            </p>
          ) : (
            <div className="space-y-3">
              {workerStats.map((s, i) => (
                <Card key={i} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{s.projetNow || "(Projet non renseigné)"}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Fiche du{" "}
                        {format(new Date(s.ficheDate), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1.5">
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      <div>
                        <span className="text-muted-foreground">Rôle : </span>
                        <span className="font-medium">{s.role}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Chef d'équipe :{" "}
                        </span>
                        <span className="font-medium">
                          {s.chefEquipe || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      <div>
                        <span className="text-muted-foreground">Du : </span>
                        <span className="font-medium">
                          {s.dateDebut || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Au : </span>
                        <span className="font-medium">{s.dateFin || "—"}</span>
                      </div>
                    </div>
                    {s.projetFuture && (
                      <div>
                        <span className="text-muted-foreground">
                          Projet suivant :{" "}
                        </span>
                        <span>{s.projetFuture}</span>
                      </div>
                    )}
                    {s.teammates.length > 0 && (
                      <div className="pt-1.5 border-t mt-2">
                        <div className="text-xs text-muted-foreground mb-1">
                          Équipe :
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {s.teammates.map((t, j) => (
                            <span
                              key={j}
                              className="text-xs px-2 py-0.5 rounded bg-muted"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
