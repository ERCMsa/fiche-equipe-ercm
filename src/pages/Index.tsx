import { useNavigate } from "react-router-dom";
import { Building2, Wrench, FileStack, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
            Gestion des Fiches
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choisissez le type de fiche à créer
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/fiches")} className="gap-2">
            <FileStack className="h-4 w-4" /> Voir les fiches
          </Button>
          <Button variant="outline" onClick={() => navigate("/workers")} className="gap-2">
            <Users className="h-4 w-4" /> Employés
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:shadow-[var(--shadow-elevated)] transition-shadow border-2 hover:border-primary"
          onClick={() => navigate("/create?type=charpenteMetallique")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-heading">
              <Building2 className="h-5 w-5 text-primary" />
              Charpente Métallique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Créer une fiche d'affectation pour les équipes de charpente métallique.
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-[var(--shadow-elevated)] transition-shadow border-2 hover:border-primary"
          onClick={() => navigate("/create?type=pieceFinition")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-heading">
              <Wrench className="h-5 w-5 text-primary" />
              Pièce Finition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Créer une fiche d'affectation pour les équipes de pièce finition.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
