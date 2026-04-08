import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Fiche } from "./data";

export function exportFichePDF(fiche: Fiche) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth(); // 297
  const pageH = doc.internal.pageSize.getHeight(); // 210
  const margin = 8;
  const tableW = pageW - margin * 2; // ~281

  const dateFicheStr = fiche.dateFiche
    ? format(new Date(fiche.dateFiche), "dd/MM/yyyy", { locale: fr })
    : "";

  // Header band
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, pageW, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Division des Groupes sur Chantier  (${dateFicheStr})`, pageW / 2, 11, { align: "center" });

  // Column config: G | Poste/Employé | Projet Now | Projet Future | Début | Fin | Observation
  const colWidths = [14, 62, 52, 52, 28, 28, tableW - 14 - 62 - 52 - 52 - 28 - 28]; // last ≈ 45
  const headers = ["G", "Poste / Employé", "Projet", "Projet Futur", "Début", "Fin", "Observation"];

  const startY = 20;

  // Table header row
  doc.setFillColor(180, 30, 30);
  doc.rect(margin, startY, tableW, 8, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");

  let xPos = margin;
  headers.forEach((h, i) => {
    doc.text(h, xPos + colWidths[i] / 2, startY + 5.5, { align: "center" });
    xPos += colWidths[i];
  });

  // Draw header borders
  doc.setDrawColor(255, 255, 255);
  let hx = margin;
  colWidths.forEach((w) => {
    doc.line(hx, startY, hx, startY + 8);
    hx += w;
  });
  doc.line(hx, startY, hx, startY + 8);

  // Rows
  let y = startY + 8;
  const rowH = 6.5;
  const roles = ["Chef d'équipe", "Monteur", "Monteur", "Ouvrier", "Grutier"];

  doc.setFontSize(7);

  fiche.equipes.forEach((eq, eqIdx) => {
    const workers = [eq.chefEquipe, eq.monteur1, eq.monteur2, eq.ouvrier, eq.grutier];
    const projetNow = eq.projetNow || "";
    const projetFuture = eq.projetFuture || "";
    const debut = eq.dateDebut ? format(new Date(eq.dateDebut), "dd/MM/yy") : "";
    const fin = eq.dateFin ? format(new Date(eq.dateFin), "dd/MM/yy") : "";
    const obs = eq.manutention || "";

    const blockH = roles.length * rowH;

    // New page check
    if (y + blockH > pageH - 8) {
      doc.addPage();
      y = 12;
    }

    const blockStartY = y;

    roles.forEach((role, rIdx) => {
      const isEven = eqIdx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 245, isEven ? 255 : 245, isEven ? 255 : 245);
      doc.rect(margin + colWidths[0], y, tableW - colWidths[0], rowH, "F");

      let x = margin + colWidths[0];

      // Role + Worker name
      doc.setTextColor(180, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(role, x + 2, y + 3);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(workers[rIdx] || "", x + 2, y + 5.8);
      x += colWidths[1];

      // Projet Now (only first row, merged cell)
      if (rIdx === 0) {
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(7);
        doc.text(projetNow, x + 2, y + blockH / 2 + 1);
      }
      x += colWidths[2];

      // Projet Future (only first row, merged cell)
      if (rIdx === 0) {
        doc.text(projetFuture, x + 2, y + blockH / 2 + 1);
      }
      x += colWidths[3];

      // Début
      if (rIdx === 0) {
        doc.text(debut, x + colWidths[4] / 2, y + blockH / 2 + 1, { align: "center" });
      }
      x += colWidths[4];

      // Fin
      if (rIdx === 0) {
        doc.text(fin, x + colWidths[5] / 2, y + blockH / 2 + 1, { align: "center" });
      }
      x += colWidths[5];

      // Observation
      if (rIdx === 0) {
        doc.text(obs, x + 2, y + blockH / 2 + 1);
      }

      // Horizontal line at bottom of each role row
      doc.setDrawColor(210, 210, 210);
      doc.line(margin + colWidths[0], y + rowH, margin + tableW, y + rowH);

      y += rowH;
    });

    // Group number cell (full block height, red background)
    doc.setFillColor(180, 30, 30);
    doc.rect(margin, blockStartY, colWidths[0], blockH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(String(eqIdx + 1), margin + colWidths[0] / 2, blockStartY + blockH / 2 + 2, { align: "center" });
    doc.setFontSize(7);

    // Vertical column lines for the block
    doc.setDrawColor(190, 190, 190);
    let lx = margin;
    colWidths.forEach((w) => {
      doc.line(lx, blockStartY, lx, blockStartY + blockH);
      lx += w;
    });
    doc.line(lx, blockStartY, lx, blockStartY + blockH);

    // Outer border for the block
    doc.setDrawColor(160, 160, 160);
    doc.rect(margin, blockStartY, tableW, blockH);

    // Thick separator between groups
    doc.setDrawColor(180, 30, 30);
    doc.setLineWidth(0.5);
    doc.line(margin, blockStartY + blockH, margin + tableW, blockStartY + blockH);
    doc.setLineWidth(0.2);
  });

  doc.save(`fiche-${dateFicheStr || "export"}.pdf`);
}
