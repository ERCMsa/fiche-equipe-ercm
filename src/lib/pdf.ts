import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Fiche } from "./data";

export function exportFichePDF(fiche: Fiche) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;

  const dateFicheStr = fiche.dateFiche
    ? format(new Date(fiche.dateFiche), "dd/MM/yyyy", { locale: fr })
    : "";

  // Header
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, pageW, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Division des Groupes sur Chantier  (${dateFicheStr})`, pageW / 2, 12, { align: "center" });

  // Table header
  const startY = 22;
  const colWidths = [12, 80, 70, 35, 25, 55];
  const headers = ["G", "Poste / Employé", "Projet", "Début", "Fin", "Observation"];

  doc.setFillColor(180, 30, 30);
  doc.rect(margin, startY, pageW - margin * 2, 8, "F");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");

  let xPos = margin;
  headers.forEach((h, i) => {
    doc.text(h, xPos + colWidths[i] / 2, startY + 5.5, { align: "center" });
    xPos += colWidths[i];
  });

  // Rows
  let y = startY + 8;
  const rowH = 7;
  const roles = ["Chef d'équipe", "Monteur", "Monteur", "Ouvrier", "Grutier"];

  doc.setFontSize(8);

  fiche.equipes.forEach((eq, eqIdx) => {
    const workers = [eq.chefEquipe, eq.monteur1, eq.monteur2, eq.ouvrier, eq.grutier];
    const projet = eq.projetNow || eq.projetFuture || "";
    const debut = eq.dateDebut ? format(new Date(eq.dateDebut), "dd/MM/yy") : "";
    const fin = eq.dateFin ? format(new Date(eq.dateFin), "dd/MM/yy") : "";
    const obs = eq.manutention || "";

    // Check if we need a new page
    if (y + roles.length * rowH > pageH - 10) {
      doc.addPage();
      y = 15;
    }

    roles.forEach((role, rIdx) => {
      const isEven = eqIdx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 245, isEven ? 255 : 245, isEven ? 255 : 245);
      doc.rect(margin, y, pageW - margin * 2, rowH, "F");

      // Group number cell
      if (rIdx === 2) {
        doc.setFillColor(180, 30, 30);
        doc.rect(margin, y - rowH * 2, colWidths[0], rowH * 5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(String(eqIdx + 1), margin + colWidths[0] / 2, y + 2, { align: "center" });
        doc.setFontSize(8);
      }

      let x = margin + colWidths[0];

      // Role + Worker
      doc.setTextColor(180, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text(role, x + 2, y + 3);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.text(workers[rIdx] || "", x + 2, y + 6);

      x += colWidths[1];

      // Projet (only on first row)
      if (rIdx === 0) {
        doc.setTextColor(60, 60, 60);
        doc.text(projet, x + 2, y + 5);
      }
      x += colWidths[2];

      // Dates (only on first row)
      if (rIdx === 0) {
        doc.text(debut, x + colWidths[3] / 2, y + 5, { align: "center" });
        x += colWidths[3];
        doc.text(fin, x + colWidths[4] / 2, y + 5, { align: "center" });
        x += colWidths[4];
        doc.text(obs, x + 2, y + 5);
      }

      // Grid lines
      doc.setDrawColor(200, 200, 200);
      let lx = margin;
      colWidths.forEach((w) => {
        doc.line(lx, y, lx, y + rowH);
        lx += w;
      });
      doc.line(lx, y, lx, y + rowH);
      doc.line(margin, y + rowH, margin + pageW - margin * 2, y + rowH);

      y += rowH;
    });
  });

  doc.save(`fiche-${dateFicheStr || "export"}.pdf`);
}
