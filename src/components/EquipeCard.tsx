import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Equipe, WORKERS } from "@/lib/data";

interface EquipeCardProps {
  equipe: Equipe;
  index: number;
  onChange: (updated: Equipe) => void;
  onRemove: () => void;
  readOnly?: boolean;
  editableDatesOnly?: boolean;
  /** Names already taken in this fiche (across all teams + roles), used to filter the dropdown. */
  takenNames?: string[];
}

function WorkerSelect({
  label,
  value,
  options,
  onChange,
  onClear,
  disabled,
  taken,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  onClear: () => void;
  disabled?: boolean;
  taken?: Set<string>;
}) {
  // Hide names already used elsewhere, but keep the currently selected value visible.
  const filtered = options.filter((w) => w === value || !taken?.has(w));

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="h-9 flex-1">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            {filtered.map((w) => (
              <SelectItem key={w} value={w}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            title="Retirer"
            aria-label={`Retirer ${label}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const date = value ? new Date(value) : undefined;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn("w-full justify-start text-left font-normal h-9", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {date ? format(date, "dd MMM yyyy", { locale: fr }) : "Choisir..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onChange(d.toISOString())}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const WORKER_FIELDS: (keyof Equipe)[] = [
  "chefEquipe",
  "monteur1",
  "monteur2",
  "monteur3",
  "ouvrier",
  "grutier",
];

export default function EquipeCard({ equipe, index, onChange, onRemove, readOnly, editableDatesOnly, takenNames }: EquipeCardProps) {
  const update = (field: keyof Equipe, value: string) => onChange({ ...equipe, [field]: value });
  const clear = (field: keyof Equipe, label: string) => {
    if (!equipe[field]) return;
    onChange({ ...equipe, [field]: "" });
    toast.success(`${label} retiré de l'équipe ${index + 1}`);
  };
  const isFieldDisabled = readOnly || editableDatesOnly;

  // Build the set of names taken in OTHER fields (this team + any provided from other teams).
  const buildTaken = (currentField: keyof Equipe): Set<string> => {
    const s = new Set<string>(takenNames ?? []);
    WORKER_FIELDS.forEach((f) => {
      if (f === currentField) return;
      const v = equipe[f] as string;
      if (v) s.add(v);
    });
    return s;
  };

  return (
    <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-heading">
            <Users className="h-4 w-4 text-primary" />
            Équipe {index + 1}
          </CardTitle>
          {!readOnly && !editableDatesOnly && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Roles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <WorkerSelect label="Chef d'équipe (1)" value={equipe.chefEquipe} options={WORKERS.chefEquipe} onChange={(v) => update("chefEquipe", v)} onClear={() => clear("chefEquipe", "Chef d'équipe")} disabled={isFieldDisabled} taken={buildTaken("chefEquipe")} />
          <WorkerSelect label="Monteur 1" value={equipe.monteur1} options={WORKERS.monteur} onChange={(v) => update("monteur1", v)} onClear={() => clear("monteur1", "Monteur 1")} disabled={isFieldDisabled} taken={buildTaken("monteur1")} />
          <WorkerSelect label="Monteur 2" value={equipe.monteur2} options={WORKERS.monteur} onChange={(v) => update("monteur2", v)} onClear={() => clear("monteur2", "Monteur 2")} disabled={isFieldDisabled} taken={buildTaken("monteur2")} />
          <WorkerSelect label="Monteur 3" value={equipe.monteur3} options={WORKERS.monteur} onChange={(v) => update("monteur3", v)} onClear={() => clear("monteur3", "Monteur 3")} disabled={isFieldDisabled} taken={buildTaken("monteur3")} />
          <WorkerSelect label="Ouvrier (1)" value={equipe.ouvrier} options={WORKERS.ouvrier} onChange={(v) => update("ouvrier", v)} onClear={() => clear("ouvrier", "Ouvrier")} disabled={isFieldDisabled} taken={buildTaken("ouvrier")} />
          <WorkerSelect label="Grutier (1)" value={equipe.grutier} options={WORKERS.grutier} onChange={(v) => update("grutier", v)} onClear={() => clear("grutier", "Grutier")} disabled={isFieldDisabled} taken={buildTaken("grutier")} />
        </div>

        {/* Project info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Projet — Now</Label>
            <Input value={equipe.projetNow} onChange={(e) => update("projetNow", e.target.value)} placeholder="Projet actuel..." disabled={isFieldDisabled} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Projet — Future</Label>
            <Input value={equipe.projetFuture} onChange={(e) => update("projetFuture", e.target.value)} placeholder="Projet futur..." disabled={isFieldDisabled} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Manutention</Label>
            <Input value={equipe.manutention} onChange={(e) => update("manutention", e.target.value)} placeholder="Manutention..." disabled={isFieldDisabled} className="h-9" />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
          <DateField label="Date Début" value={equipe.dateDebut} onChange={(v) => update("dateDebut", v)} disabled={readOnly} />
          <DateField label="Date Fin" value={equipe.dateFin} onChange={(v) => update("dateFin", v)} disabled={readOnly} />
        </div>
      </CardContent>
    </Card>
  );
}
