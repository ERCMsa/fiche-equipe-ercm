import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Fiche } from "./data";

export function exportFichePDF(fiche: Fiche) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 10;
  const contentW = pageW - margin * 2;

  const dateFicheStr = fiche.dateFiche
    ? format(new Date(fiche.dateFiche), "dd/MM/yyyy", { locale: fr })
    : "";

  // ── Header ──
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const headerTitle = fiche.ficheType === "pieceFinition"
    ? "Fiche Équipement — Pièce Finition"
    : "Division des Groupes sur Chantier";
  doc.text(headerTitle, pageW / 2, 10, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Date de fiche : ${dateFicheStr}`, margin, 18);

  let y = 28;

  {
    // ── charpenteMetallique: per-équipe rendering ──
    const allRoles: { key: keyof typeof fiche.equipes[0]; label: string }[] = [
      { key: "chefEquipe", label: "Chef d'équipe" },
      { key: "monteur1", label: "Monteur 1" },
      { key: "monteur2", label: "Monteur 2" },
      { key: "monteur3", label: "Monteur 3" },
      { key: "ouvrier", label: "Ouvrier" },
      { key: "grutier", label: "Grutier" },
    ];

    fiche.equipes.forEach((eq, eqIdx) => {
      const filledRoles = allRoles.filter((r) => (eq[r.key] as string)?.trim());
      const projetNow = eq.projetNow || "";
      const projetFuture = eq.projetFuture || "";
      const debut = eq.dateDebut ? format(new Date(eq.dateDebut), "dd/MM/yyyy", { locale: fr }) : "";
      const fin = eq.dateFin ? format(new Date(eq.dateFin), "dd/MM/yyyy", { locale: fr }) : "";
      const obs = eq.manutention || "";

      const blockH = 8 + 6 + filledRoles.length * 6 + 4 + 21 + 6;
      if (y + blockH > pageH - margin) {
        doc.addPage();
        y = margin;
      }

      // Équipe header with project name centered
      doc.setFillColor(180, 30, 30);
      doc.rect(margin, y, contentW, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Équipe ${eqIdx + 1}`, margin + 4, y + 5.5);
      if (projetNow) {
        doc.setFontSize(10);
        doc.text(projetNow, margin + contentW / 2, y + 5.5, { align: "center" });
      }
      y += 8;

      const col1 = 45;
      const rowH = 6;

      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, contentW, rowH, "F");
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("Poste", margin + 2, y + 4);
      doc.text("Employé", margin + col1 + 2, y + 4);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y + rowH, margin + contentW, y + rowH);
      y += rowH;

      const tableTopY = y;
      filledRoles.forEach((role, rIdx) => {
        if (rIdx % 2 === 0) doc.setFillColor(252, 252, 252);
        else doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, contentW, rowH, "F");

        doc.setTextColor(180, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(role.label, margin + 2, y + 4);

        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text((eq[role.key] as string) || "—", margin + col1 + 2, y + 4);

        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y + rowH, margin + contentW, y + rowH);
        doc.line(margin + col1, y, margin + col1, y + rowH);
        y += rowH;
      });

      doc.setDrawColor(180, 180, 180);
      doc.rect(margin, tableTopY - rowH, contentW, (filledRoles.length + 1) * rowH);

      y += 2;

      const infoRowH = 7;
      const labelW = 32;
      const halfW = contentW / 2;

      // Projet Now / Projet Futur
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, contentW, infoRowH, "F");
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, y, contentW, infoRowH);
      doc.line(margin + halfW, y, margin + halfW, y + infoRowH);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("Projet Now", margin + 2, y + 4.5);
      doc.text("Projet Futur", margin + halfW + 2, y + 4.5);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(projetNow, margin + labelW, y + 4.5);
      doc.text(projetFuture, margin + halfW + labelW, y + 4.5);
      y += infoRowH;

      doc.setFillColor(252, 252, 252);
      doc.rect(margin, y, contentW, infoRowH, "F");
      doc.rect(margin, y, contentW, infoRowH);
      doc.line(margin + halfW, y, margin + halfW, y + infoRowH);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("Début", margin + 2, y + 4.5);
      doc.text("Fin", margin + halfW + 2, y + 4.5);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(debut, margin + labelW, y + 4.5);
      doc.text(fin, margin + halfW + labelW, y + 4.5);
      y += infoRowH;

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, contentW, infoRowH, "F");
      doc.rect(margin, y, contentW, infoRowH);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("Observation", margin + 2, y + 4.5);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(obs, margin + labelW, y + 4.5);
      y += infoRowH;

      y += 6;
    });

    // End block: list of projects grouped by état
    const projectList = fiche.projects?.length
      ? fiche.projects
      : fiche.nomProjet
      ? [{ id: "x", nom: fiche.nomProjet, etat: fiche.etat }]
      : [];

    const groups: { title: string; etat: string; items: typeof projectList; bg: [number, number, number] }[] = [
      { title: "Projets Urgent", etat: "urgent", items: projectList.filter((p) => p.etat === "urgent"), bg: [200, 30, 30] },
      { title: "Projets Important", etat: "important", items: projectList.filter((p) => p.etat === "important"), bg: [220, 150, 30] },
      { title: "Projets Pas urgent", etat: "pas_urgent", items: projectList.filter((p) => p.etat === "pas_urgent"), bg: [40, 160, 60] },
      { title: "Projets Non Important", etat: "non_important", items: projectList.filter((p) => p.etat === "non_important"), bg: [130, 130, 140] },
    ];

    const badgeLabelFor = (etat: string) => {
      if (etat === "urgent") return "URGENT";
      if (etat === "important") return "IMPORTANT";
      if (etat === "non_important") return "NON IMPORTANT";
      return "Pas urgent";
    };
    const badgeColorFor = (etat: string): [number, number, number] => {
      if (etat === "urgent") return [200, 30, 30];
      if (etat === "important") return [220, 150, 30];
      if (etat === "non_important") return [130, 130, 140];
      return [40, 160, 60];
    };

    groups.forEach((group) => {
      if (group.items.length === 0) return;

      const headerH = 8;
      const rowH = 7;
      const totalH = headerH + group.items.length * rowH;
      if (y + totalH > pageH - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setFillColor(group.bg[0], group.bg[1], group.bg[2]);
      doc.rect(margin, y, contentW, headerH, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(group.title, margin + contentW / 2, y + 5.5, { align: "center" });
      y += headerH;

      group.items.forEach((p, i) => {
        if (i % 2 === 0) doc.setFillColor(252, 252, 252);
        else doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, contentW, rowH, "F");
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y + rowH, margin + contentW, y + rowH);

        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(p.nom || "—", margin + 4, y + 4.7);

        const badgeLabel = badgeLabelFor(p.etat);
        const badgeW = 32;
        const badgeX = margin + contentW - badgeW - 4;
        const bc = badgeColorFor(p.etat);
        doc.setFillColor(bc[0], bc[1], bc[2]);
        doc.roundedRect(badgeX, y + 1, badgeW, rowH - 2, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(badgeLabel, badgeX + badgeW / 2, y + 4.5, { align: "center" });

        y += rowH;
      });

      doc.setDrawColor(180, 180, 180);
      doc.rect(margin, y - group.items.length * rowH - headerH, contentW, totalH);
      y += 4;
    });
  }

  doc.save(`fiche-${dateFicheStr || "export"}.pdf`);
}
