import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Pencil, Trash2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import EquipeCard from "@/components/EquipeCard";
import { Fiche, Equipe, loadFiches, saveFiches } from "@/lib/data";

export default function FicheList() {
  const navigate = useNavigate();
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setFiches(loadFiches());
  }, []);

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const deleteFiche = (id: string) => {
    const updated = fiches.filter((f) => f.id !== id);
    saveFiches(updated);
    setFiches(updated);
    toast.success("Fiche supprimée.");
  };

  const startEdit = (id: string) => setEditingId(id);

  const updateEquipeInFiche = (ficheId: string, eqIndex: number, updated: Equipe) => {
    setFiches((prev) =>
      prev.map((f) =>
        f.id === ficheId
          ? { ...f, equipes: f.equipes.map((e, i) => (i === eqIndex ? updated : e)), updatedAt: new Date().toISOString() }
          : f
      )
    );
  };

  const saveEdit = (ficheId: string) => {
    saveFiches(fiches);
    setEditingId(null);
    toast.success("Fiche mise à jour.");
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Fiches enregistrées</h1>
          <p className="text-sm text-muted-foreground mt-1">{fiches.length} fiche{fiches.length !== 1 ? "s" : ""} au total</p>
        </div>
        <Button onClick={() => navigate("/")} className="gap-2">
          <Plus className="h-4 w-4" /> Nouvelle Fiche
        </Button>
      </div>

      {fiches.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="flex flex-col items-center gap-3">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Aucune fiche enregistrée</p>
            <Button onClick={() => navigate("/")} variant="outline" className="mt-2">Créer une fiche</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {fiches.map((fiche) => {
            const isExpanded = expandedId === fiche.id;
            const isEditing = editingId === fiche.id;
            return (
              <Card key={fiche.id} className="shadow-[var(--shadow-card)]">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleExpand(fiche.id)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-heading flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Fiche du {format(new Date(fiche.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                      <span className="text-xs font-normal text-muted-foreground ml-2">
                        ({fiche.equipes.length} équipe{fiche.equipes.length !== 1 ? "s" : ""})
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {isExpanded && !isEditing && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); startEdit(fiche.id); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteFiche(fiche.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-3 pt-2">
                    {fiche.equipes.map((eq, i) => (
                      <EquipeCard
                        key={eq.id}
                        equipe={eq}
                        index={i}
                        onChange={(u) => updateEquipeInFiche(fiche.id, i, u)}
                        onRemove={() => {}}
                        readOnly={!isEditing}
                        editableDatesOnly={isEditing}
                      />
                    ))}
                    {isEditing && (
                      <div className="flex gap-2 pt-2">
                        <Button onClick={() => saveEdit(fiche.id)} className="gap-2">Sauvegarder</Button>
                        <Button variant="outline" onClick={() => { setEditingId(null); setFiches(loadFiches()); }}>Annuler</Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
