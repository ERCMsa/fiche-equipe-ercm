import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Equipe, Fiche, ProjectEntry, WorkerRecord } from "./data";

function refNumber(fiche: Fiche, equipeIndex: number): string {
  const d = new Date(fiche.dateFiche || fiche.createdAt);
  const year = d.getFullYear();
  const short = (fiche.id || "").replace(/-/g, "").slice(0, 4).toUpperCase();
  return `OM-${year}-${short}-${String(equipeIndex + 1).padStart(2, "0")}`;
}

const ROLES: { key: keyof Equipe; label: string }[] = [
  { key: "chefEquipe", label: "Chef d'équipe" },
  { key: "monteur1", label: "Monteur 1" },
  { key: "monteur2", label: "Monteur 2" },
  { key: "monteur3", label: "Monteur 3" },
  { key: "ouvrier", label: "Ouvrier" },
  { key: "grutier", label: "Grutier" },
];

export function generateOrdreMission(
  fiche: Fiche,
  equipe: Equipe,
  equipeIndex: number,
  workers: WorkerRecord[] = []
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;

  const ref = refNumber(fiche, equipeIndex);
  const today = format(new Date(), "dd/MM/yyyy", { locale: fr });
  const dateFicheStr = fiche.dateFiche
    ? format(new Date(fiche.dateFiche), "dd/MM/yyyy", { locale: fr })
    : today;
  const debut = equipe.dateDebut ? format(new Date(equipe.dateDebut), "dd/MM/yyyy", { locale: fr }) : "—";
  const fin = equipe.dateFin ? format(new Date(equipe.dateFin), "dd/MM/yyyy", { locale: fr }) : "—";
  const typeLabel = fiche.ficheType === "pieceFinition" ? "Pièce Finition" : "Charpente Métallique";

  // ── Header band ──
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, pageW, 26, "F");

  // Logo placeholder square
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 5, 16, 16, 2, 2, "F");
  doc.setTextColor(180, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ERCM", margin + 8, 14.5, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("ERCMSA SALHI ADEL", margin + 20, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Charpente Métallique & Pièce de Finition", margin + 20, 17);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`Réf : ${ref}`, pageW - margin, 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`Date : ${today}`, pageW - margin, 17, { align: "right" });

  let y = 34;

  // ── Title ──
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ORDRE DE MISSION", pageW / 2, y, { align: "center" });
  y += 3;
  doc.setDrawColor(180, 30, 30);
  doc.setLineWidth(0.8);
  doc.line(pageW / 2 - 30, y, pageW / 2 + 30, y);
  doc.setLineWidth(0.2);
  y += 8;

  // Helper for section header
  const section = (title: string) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentW, 7, "F");
    doc.setDrawColor(180, 30, 30);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin, y + 7);
    doc.setLineWidth(0.2);
    doc.setTextColor(180, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, margin + 3, y + 5);
    y += 9;
  };

  // Helper key/value row
  const kv = (label: string, value: string) => {
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(label, margin + 2, y);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(value || "—", contentW - 55);
    doc.text(lines, margin + 50, y);
    y += Math.max(5.5, lines.length * 5);
  };

  // ── General info ──
  section("INFORMATIONS GÉNÉRALES");
  kv("Référence :", ref);
  kv("Date de fiche :", dateFicheStr);
  kv("Type de fiche :", typeLabel);
  kv("Équipe :", `Équipe ${equipeIndex + 1}`);
  y += 2;

  // ── Personnel ──
  section("PERSONNEL AFFECTÉ");
  const rowH = 6.5;
  const col1 = 55;

  // Table header
  doc.setFillColor(180, 30, 30);
  doc.rect(margin, y, contentW, rowH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Poste", margin + 2, y + 4.5);
  doc.text("Nom & Prénom", margin + col1 + 2, y + 4.5);
  doc.text("Téléphone", margin + col1 + 80, y + 4.5);
  y += rowH;

  const filledRoles = ROLES.filter((r) => (equipe[r.key] as string)?.trim());
  const prestataires: string[] = [];

  filledRoles.forEach((role, i) => {
    if (i % 2 === 0) doc.setFillColor(252, 252, 252);
    else doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentW, rowH, "F");
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y + rowH, margin + contentW, y + rowH);

    const name = equipe[role.key] as string;
    const worker = workers.find((w) => w.name === name);
    if (worker?.isPrestataire) prestataires.push(name);

    doc.setTextColor(180, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(role.label, margin + 2, y + 4.5);

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.text(name + (worker?.isPrestataire ? " (Prestataire)" : ""), margin + col1 + 2, y + 4.5);
    doc.text(worker?.phone || "—", margin + col1 + 80, y + 4.5);
    y += rowH;
  });

  doc.setDrawColor(180, 180, 180);
  doc.rect(margin, y - (filledRoles.length + 1) * rowH, contentW, (filledRoles.length + 1) * rowH);
  y += 4;

  if (prestataires.length > 0) {
    section("PRESTATAIRE");
    kv("Intervenants :", prestataires.join(", "));
    y += 2;
  }

  // ── Mission ──
  section("MISSION & CHANTIER");
  kv("Projet actuel :", equipe.projetNow || "—");
  kv("Projet futur :", equipe.projetFuture || "—");
  kv("Manutention :", equipe.manutention || "—");
  kv("Date début :", debut);
  kv("Date fin :", fin);
  y += 2;

  // ── Projects list ──
  const projs: ProjectEntry[] = fiche.projects?.filter((p) => p.nom?.trim()) || [];
  if (projs.length > 0) {
    section("PROJETS ASSOCIÉS");
    projs.forEach((p) => {
      const urg = p.etat === "urgent" ? "URGENT" : "Pas urgent";
      const imp = p.importance === "important" ? "Important" : "Non Important";
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`• ${p.nom}  —  ${urg} / ${imp}`, margin + 2, y);
      y += 5.5;
    });
    y += 2;
  }

  // ── Signatures ──
  if (y > pageH - 60) {
    doc.addPage();
    y = margin;
  }
  y = Math.max(y + 6, pageH - 55);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const sigW = (contentW - 10) / 2;
  doc.text("Responsable", margin + sigW / 2, y, { align: "center" });
  doc.text("Chef d'équipe", margin + sigW + 10 + sigW / 2, y, { align: "center" });
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.rect(margin, y, sigW, 25);
  doc.rect(margin + sigW + 10, y, sigW, 25);
  y += 25;

  // ── Footer ──
  doc.setDrawColor(180, 30, 30);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Document généré le ${today}`, margin, pageH - 7);
  doc.text(`ERCMSA SALHI ADEL — ${ref}`, pageW - margin, pageH - 7, { align: "right" });

  const equipeName = (equipe.chefEquipe || `Equipe-${equipeIndex + 1}`).replace(/\s+/g, "_");
  const dateStr = format(new Date(fiche.dateFiche || fiche.createdAt), "yyyy-MM-dd");
  doc.save(`Ordre_Mission_${equipeName}_${dateStr}.pdf`);
}
