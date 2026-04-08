import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Trash2, Users } from "lucide-react";
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
}

function WorkerSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Sélectionner..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((w) => (
            <SelectItem key={w} value={w}>{w}</SelectItem>
          ))}
        </SelectContent>
      </Select>
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

export default function EquipeCard({ equipe, index, onChange, onRemove, readOnly, editableDatesOnly }: EquipeCardProps) {
  const update = (field: keyof Equipe, value: string) => onChange({ ...equipe, [field]: value });
  const isFieldDisabled = readOnly || editableDatesOnly;

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
          <WorkerSelect label="Chef d'équipe (1)" value={equipe.chefEquipe} options={WORKERS.chefEquipe} onChange={(v) => update("chefEquipe", v)} disabled={isFieldDisabled} />
          <WorkerSelect label="Monteur 1" value={equipe.monteur1} options={WORKERS.monteur} onChange={(v) => update("monteur1", v)} disabled={isFieldDisabled} />
          <WorkerSelect label="Monteur 2" value={equipe.monteur2} options={WORKERS.monteur} onChange={(v) => update("monteur2", v)} disabled={isFieldDisabled} />
          <WorkerSelect label="Ouvrier (1)" value={equipe.ouvrier} options={WORKERS.ouvrier} onChange={(v) => update("ouvrier", v)} disabled={isFieldDisabled} />
          <WorkerSelect label="Grutier (1)" value={equipe.grutier} options={WORKERS.grutier} onChange={(v) => update("grutier", v)} disabled={isFieldDisabled} />
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
