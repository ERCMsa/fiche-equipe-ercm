import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Fiche } from "./data";

export function exportFichePDF(fiche: Fiche) {
  // Debug: log fiche data to confirm completeness
  console.log("Exporting PDF for fiche:", JSON.stringify(fiche, null, 2));

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 10;
  const contentW = pageW - margin * 2; // 190mm

  const dateFicheStr = fiche.dateFiche
    ? format(new Date(fiche.dateFiche), "dd/MM/yyyy", { locale: fr })
    : "";
  const dateCreationStr = fiche.createdAt
    ? format(new Date(fiche.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })
    : "";

  // ── Header band ──
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Division des Groupes sur Chantier", pageW / 2, 10, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Date de fiche : ${dateFicheStr}`, margin, 18);
  doc.text(`Créée le : ${dateCreationStr}`, pageW - margin, 18, { align: "right" });

  let y = 28;

  // ── Per-équipe rendering ──
  const roles = ["Chef d'équipe", "Monteur 1", "Monteur 2", "Ouvrier", "Grutier"];

  fiche.equipes.forEach((eq, eqIdx) => {
    const workers = [eq.chefEquipe, eq.monteur1, eq.monteur2, eq.ouvrier, eq.grutier];
    const projetNow = eq.projetNow || "";
    const projetFuture = eq.projetFuture || "";
    const debut = eq.dateDebut ? format(new Date(eq.dateDebut), "dd/MM/yyyy", { locale: fr }) : "";
    const fin = eq.dateFin ? format(new Date(eq.dateFin), "dd/MM/yyyy", { locale: fr }) : "";
    const obs = eq.manutention || "";

    // Estimate block height: header(8) + 5 role rows(6 each = 30) + project section(18) + gap(4) ≈ 60
    const blockH = 60;

    // New page check
    if (y + blockH > pageH - margin) {
      doc.addPage();
      y = margin;
    }

    // ── Équipe header ──
    doc.setFillColor(180, 30, 30);
    doc.rect(margin, y, contentW, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Équipe ${eqIdx + 1}`, margin + 4, y + 5.5);
    y += 8;

    // ── Roles table ──
    const col1 = 45; // Role label
    const col2 = contentW - col1; // Worker name
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

    // Role rows
    roles.forEach((role, rIdx) => {
      const isEven = rIdx % 2 === 0;
      if (isEven) {
        doc.setFillColor(252, 252, 252);
      } else {
        doc.setFillColor(245, 245, 245);
      }
      doc.rect(margin, y, contentW, rowH, "F");

      doc.setTextColor(180, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(role, margin + 2, y + 4);

      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(workers[rIdx] || "—", margin + col1 + 2, y + 4);

      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + rowH, margin + contentW, y + rowH);
      // Vertical separator
      doc.line(margin + col1, y, margin + col1, y + rowH);
      y += rowH;
    });

    // Outer border for roles table
    doc.setDrawColor(180, 180, 180);
    doc.rect(margin, y - roles.length * rowH - rowH, contentW, (roles.length + 1) * rowH);

    y += 2;

    // ── Project / Dates / Observation section ──
    const infoRowH = 7;
    const labelW = 32;
    const halfW = contentW / 2;

    // Row 1: Projet Now | Projet Future
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

    // Row 2: Début | Fin
    doc.setFillColor(252, 252, 252);
    doc.rect(margin, y, contentW, infoRowH, "F");
    doc.setDrawColor(200, 200, 200);
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

    // Row 3: Observation/Manutention
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentW, infoRowH, "F");
    doc.setDrawColor(200, 200, 200);
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

    // Gap between équipes
    y += 6;
  });

  doc.save(`fiche-${dateFicheStr || "export"}.pdf`);
}
