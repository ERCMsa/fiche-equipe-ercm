import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Equipe, Fiche, WorkerRecord } from "./data";

// ── Palette (matches reference design) ──
const NAVY: [number, number, number] = [45, 62, 80];
const NAVY_SOFT: [number, number, number] = [70, 90, 110];
const RED: [number, number, number] = [200, 32, 39];
const RED_SOFT: [number, number, number] = [248, 215, 218];
const RED_BORDER: [number, number, number] = [240, 180, 185];
const MINT: [number, number, number] = [200, 240, 232];
const MINT_BORDER: [number, number, number] = [120, 200, 185];
const INK: [number, number, number] = [40, 50, 60];
const MUTED: [number, number, number] = [120, 130, 140];
const FIELD: [number, number, number] = [248, 250, 252];
const FIELD_BORDER: [number, number, number] = [220, 226, 232];
const BLUE_SOFT: [number, number, number] = [220, 232, 246];

function refNumber(fiche: Fiche, equipeIndex: number): string {
  const d = new Date(fiche.dateFiche || fiche.createdAt);
  const y = d.getFullYear();
  const short = (fiche.id || "").replace(/-/g, "").slice(0, 4).toUpperCase();
  return `OM-${y}-${short}-${String(equipeIndex + 1).padStart(2, "0")}`;
}

const ROLES: { key: keyof Equipe; label: string; short: string }[] = [
  { key: "chefEquipe", label: "Chef d'équipe", short: "Chef équipe" },
  { key: "monteur1", label: "Monteur 1", short: "Monteur" },
  { key: "monteur2", label: "Monteur 2", short: "Monteur 2" },
  { key: "monteur3", label: "Monteur 3", short: "Monteur 3" },
  { key: "ouvrier", label: "Ouvrier", short: "Ouvrier" },
  { key: "grutier", label: "Grutier", short: "Grutier" },
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
  const margin = 10;
  const contentW = pageW - margin * 2;

  const ref = refNumber(fiche, equipeIndex);
  const today = format(new Date(), "dd/MM/yyyy", { locale: fr });
  const dateFicheStr = fiche.dateFiche
    ? format(new Date(fiche.dateFiche), "dd/MM/yyyy", { locale: fr })
    : today;
  const typeLabel = fiche.ficheType === "pieceFinition" ? "Pièce Finition" : "Charpente Métallique";
  const projetPrincipal = equipe.projetNow || fiche.projects?.[0]?.nom || "";

  // ──────────────────────────────────────────────
  // HEADER BAR
  // ──────────────────────────────────────────────
  const headerH = 22;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, headerH, "F");

  // Doc ref pill (left)
  doc.setFillColor(...NAVY_SOFT);
  doc.roundedRect(margin, 6, 38, 10, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(ref, margin + 19, 12.6, { align: "center" });

  // Title (center)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("ORDRE DE MISSION", pageW / 2, 13.5, { align: "center" });

  // ERCM logo block (right)
  const logoW = 26;
  const logoH = 14;
  const logoX = pageW - margin - logoW;
  const logoY = 4;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(logoX, logoY, logoW, logoH, 1.5, 1.5, "F");
  doc.setFillColor(...RED);
  doc.roundedRect(logoX + 1.5, logoY + 1.5, logoW - 3, logoH - 3, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ERCM", logoX + logoW / 2, logoY + logoH / 2 + 1.6, { align: "center" });
  doc.setFontSize(5);
  doc.text("SALHI ADEL", logoX + logoW / 2, logoY + logoH - 1.5, { align: "center" });

  let y = headerH + 6;

  // ──────────────────────────────────────────────
  // FORM FIELD ROWS (sender / date / receiver / project)
  // ──────────────────────────────────────────────
  const fieldRow = (
    leftLabel: string,
    leftValue: string,
    rightLabel: string,
    rightValue: string,
    leftIcon?: "calendar"
  ) => {
    const rowH = 9;
    const labelW = 28;
    const halfW = (contentW - 6) / 2;
    const leftX = margin;
    const rightX = margin + halfW + 6;

    [leftX, rightX].forEach((x, idx) => {
      const label = idx === 0 ? leftLabel : rightLabel;
      const value = idx === 0 ? leftValue : rightValue;
      const isLeftCol = idx === 0;
      const showCalIcon = leftIcon === "calendar" && isLeftCol;

      // Label box (right side of input)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...FIELD_BORDER);
      doc.setLineWidth(0.2);
      doc.text("", 0, 0);
      // Label
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(label, x + halfW - labelW, y + rowH / 2 + 1, { align: "right" });

      // Input pill (left of label)
      const inputW = halfW - labelW - 2;
      doc.setFillColor(...FIELD);
      doc.roundedRect(x, y, inputW, rowH, 1.5, 1.5, "F");
      doc.setDrawColor(...FIELD_BORDER);
      doc.roundedRect(x, y, inputW, rowH, 1.5, 1.5, "S");

      if (showCalIcon) {
        // Tiny calendar icon
        doc.setDrawColor(...MUTED);
        doc.setLineWidth(0.3);
        doc.rect(x + 3, y + rowH / 2 - 1.7, 3.4, 3.4);
        doc.line(x + 3, y + rowH / 2 - 0.7, x + 6.4, y + rowH / 2 - 0.7);
      }

      doc.setTextColor(...INK);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const padLeft = showCalIcon ? 9 : 4;
      const text = value || "—";
      const maxW = inputW - padLeft - 3;
      const lines = doc.splitTextToSize(text, maxW);
      doc.text(lines[0], x + padLeft, y + rowH / 2 + 1.2);
    });

    y += rowH + 2;
  };

  fieldRow("Émetteur :", "ERCMSA SALHI ADEL", "Date :", dateFicheStr, "calendar");
  fieldRow("Récepteur :", "Équipe " + (equipeIndex + 1), "Lieu du projet :", projetPrincipal);

  y += 3;

  // ──────────────────────────────────────────────
  // SECTION TITLE helper (right-aligned style with red accent underline)
  // ──────────────────────────────────────────────
  const sectionTitle = (title: string) => {
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, pageW - margin, y, { align: "right" });
    // Red short underline accent
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.9);
    const titleW = doc.getTextWidth(title);
    doc.line(pageW - margin - titleW * 0.35, y + 1.5, pageW - margin, y + 1.5);
    doc.setLineWidth(0.2);
    y += 5;
  };

  // ──────────────────────────────────────────────
  // SECTION : Détails de la Mission
  // ──────────────────────────────────────────────
  sectionTitle("Détails de la Mission");

  // 3-column card
  const detailsH = 18;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...FIELD_BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentW, detailsH, 2, 2, "FD");
  doc.setLineWidth(0.2);

  const cells = [
    { label: "Type de fiche", value: typeLabel },
    { label: "N° Plaque / Réf.", value: ref },
    { label: "Boîte équipement", value: "Box-" + (equipeIndex + 1) },
  ];
  const cellW = contentW / 3;
  cells.forEach((c, i) => {
    const cx = margin + i * cellW;
    if (i > 0) {
      doc.setDrawColor(...FIELD_BORDER);
      doc.line(cx, y + 3, cx, y + detailsH - 3);
    }
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(c.label + " :", cx + cellW - 3, y + 5, { align: "right" });

    // input pill
    const pillX = cx + 4;
    const pillW = cellW - 8;
    doc.setFillColor(...FIELD);
    doc.setDrawColor(...FIELD_BORDER);
    doc.roundedRect(pillX, y + 8, pillW, 7, 1.5, 1.5, "FD");
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(c.value || "—", pillW - 4);
    doc.text(lines[0], pillX + pillW / 2, y + 12.5, { align: "center" });
  });
  y += detailsH + 6;

  // ──────────────────────────────────────────────
  // SECTION : Personnel affecté à la mission
  // ──────────────────────────────────────────────
  sectionTitle("Personnel affecté à la mission");

  // Table: Name | Phone | + role checkbox columns
  const checkCols = ROLES.map((r) => r.short);
  const nameColW = 50;
  const phoneColW = 28;
  const remainingW = contentW - nameColW - phoneColW;
  const checkColW = remainingW / checkCols.length;

  // Header row
  const headerRowH = 12;
  doc.setFillColor(...NAVY);
  doc.roundedRect(margin, y, contentW, headerRowH, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Nom & Prénom", margin + 4, y + headerRowH / 2 + 1);
  doc.text("Téléphone", margin + nameColW + phoneColW / 2, y + headerRowH / 2 + 1, { align: "center" });

  // Rotated/short role headers — keep short text, two lines if needed
  doc.setFontSize(7.5);
  checkCols.forEach((label, i) => {
    const cx = margin + nameColW + phoneColW + i * checkColW + checkColW / 2;
    const lines = doc.splitTextToSize(label, checkColW - 2);
    const startY = y + headerRowH / 2 + 1 - ((lines.length - 1) * 2.2);
    lines.forEach((ln: string, li: number) => {
      doc.text(ln, cx, startY + li * 3.2, { align: "center" });
    });
  });
  y += headerRowH;

  // Row per filled member
  const filledRoles = ROLES.filter((r) => (equipe[r.key] as string)?.trim());
  const rowH = 9;

  if (filledRoles.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...FIELD_BORDER);
    doc.roundedRect(margin, y, contentW, rowH, 1, 1, "FD");
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.text("Aucun personnel affecté.", pageW / 2, y + rowH / 2 + 1, { align: "center" });
    y += rowH;
  } else {
    filledRoles.forEach((role, ri) => {
      const name = equipe[role.key] as string;
      const worker = workers.find((w) => w.name === name);

      // alternating background
      if (ri % 2 === 0) doc.setFillColor(252, 253, 254);
      else doc.setFillColor(245, 247, 250);
      doc.rect(margin, y, contentW, rowH, "F");

      // Name pill
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...FIELD_BORDER);
      doc.roundedRect(margin + 2, y + 1.5, nameColW - 4, rowH - 3, 1, 1, "FD");
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      const nameLines = doc.splitTextToSize(
        name + (worker?.isPrestataire ? " (Prest.)" : ""),
        nameColW - 8
      );
      doc.text(nameLines[0], margin + 4, y + rowH / 2 + 1);

      // Phone (role badge style)
      doc.setFillColor(...RED_SOFT);
      doc.setDrawColor(...RED_BORDER);
      const phonePillX = margin + nameColW + 2;
      const phonePillW = phoneColW - 4;
      doc.roundedRect(phonePillX, y + 1.5, phonePillW, rowH - 3, 1, 1, "FD");
      doc.setTextColor(...RED);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.8);
      doc.text(worker?.phone || role.short, phonePillX + phonePillW / 2, y + rowH / 2 + 1, {
        align: "center",
      });

      // Role checkboxes — tick the one matching this row's role
      checkCols.forEach((_, i) => {
        const cx = margin + nameColW + phoneColW + i * checkColW + checkColW / 2;
        const boxSize = 3.8;
        const bx = cx - boxSize / 2;
        const by = y + rowH / 2 - boxSize / 2;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...NAVY_SOFT);
        doc.setLineWidth(0.3);
        doc.roundedRect(bx, by, boxSize, boxSize, 0.5, 0.5, "FD");
        if (ROLES[i].key === role.key) {
          doc.setFillColor(...NAVY);
          doc.roundedRect(bx + 0.7, by + 0.7, boxSize - 1.4, boxSize - 1.4, 0.3, 0.3, "F");
          // tick
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.6);
          doc.line(bx + 1, by + boxSize / 2 + 0.1, bx + boxSize / 2 - 0.2, by + boxSize - 1);
          doc.line(bx + boxSize / 2 - 0.2, by + boxSize - 1, bx + boxSize - 0.7, by + 0.9);
          doc.setLineWidth(0.2);
        }
      });

      // bottom separator
      doc.setDrawColor(...FIELD_BORDER);
      doc.setLineWidth(0.2);
      doc.line(margin, y + rowH, margin + contentW, y + rowH);

      y += rowH;
    });
  }

  // Outer table border
  doc.setDrawColor(...FIELD_BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(
    margin,
    y - headerRowH - filledRoles.length * rowH - (filledRoles.length === 0 ? rowH : 0),
    contentW,
    headerRowH + Math.max(filledRoles.length, 1) * rowH,
    1.5,
    1.5,
    "S"
  );
  doc.setLineWidth(0.2);

  y += 6;

  // ──────────────────────────────────────────────
  // SECTION : Instructions importantes
  // ──────────────────────────────────────────────
  sectionTitle("Instructions importantes");

  const instrPad = 4;
  const instrTopY = y;
  const instructions: { text: string; tone: "mint" | "rule" }[] = [
    { text: "Le chef d'équipe est responsable des véhicules et des équipements.", tone: "mint" },
    { text: "La mission ne peut être modifiée que par accord écrit de la Direction générale, accompagné d'un ordre spécifique.", tone: "rule" },
    { text: "Les membres affectés à cet ordre ne peuvent être modifiés que par écrit.", tone: "rule" },
    { text: "Le responsable direct ou le magasinier doit être informé 24 h à l'avance des besoins (boulonneuse / visseuse / clés / meules…).", tone: "rule" },
    { text: "Informer le chef de production 72 h avant la livraison du gros matériel (groupe électrogène / camion / grue / clark / profilé / boulonnerie / rondelle…).", tone: "rule" },
    { text: "Un rapport quotidien doit être envoyé au chef de production et au directeur général à 16:30.", tone: "rule" },
    { text: "Le responsable qui préserve le matériel et exécute la mission dans les délais reçoit une prime de l'entreprise.", tone: "mint" },
  ];

  // Outer pink/red wash card around the list
  const itemH = 9;
  const innerGap = 2;
  const listH = instructions.length * itemH + (instructions.length - 1) * innerGap + instrPad * 2;

  doc.setFillColor(...RED_SOFT);
  doc.setDrawColor(...RED_BORDER);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, instrTopY, contentW, listH, 3, 3, "FD");
  doc.setLineWidth(0.2);

  let iy = instrTopY + instrPad;
  instructions.forEach((it) => {
    const isMint = it.tone === "mint";
    if (isMint) {
      doc.setFillColor(...MINT);
      doc.setDrawColor(...MINT_BORDER);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...RED_BORDER);
    }
    doc.setLineWidth(0.3);
    doc.roundedRect(margin + instrPad, iy, contentW - instrPad * 2, itemH, 1.5, 1.5, "FD");
    doc.setLineWidth(0.2);

    // Left accent bar
    if (isMint) doc.setFillColor(...MINT_BORDER);
    else doc.setFillColor(...RED);
    doc.roundedRect(margin + instrPad, iy, 1.6, itemH, 0.8, 0.8, "F");

    doc.setTextColor(...INK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    const tx = margin + instrPad + 4;
    const tw = contentW - instrPad * 2 - 8;
    const lines = doc.splitTextToSize(it.text, tw);
    // single-line fit; truncate if exceeds
    doc.text(lines[0] + (lines.length > 1 ? "…" : ""), tx, iy + itemH / 2 + 1);

    iy += itemH + innerGap;
  });

  y = instrTopY + listH + 6;

  // ──────────────────────────────────────────────
  // SECTION : Signatures
  // ──────────────────────────────────────────────
  sectionTitle("Signatures");

  const sigOuterH = 32;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BLUE_SOFT);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, y, contentW, sigOuterH, 2.5, 2.5, "FD");
  doc.setLineWidth(0.2);

  const sigLabels = ["Chef d'équipe", "Directeur Production", "Directeur Général"];
  const sigInnerPad = 4;
  const sigW = (contentW - sigInnerPad * 4) / 3;
  sigLabels.forEach((label, i) => {
    const sx = margin + sigInnerPad + i * (sigW + sigInnerPad);
    const sy = y + sigInnerPad;
    const sh = sigOuterH - sigInnerPad * 2;
    // dashed card
    doc.setDrawColor(180, 195, 215);
    doc.setLineDashPattern([1, 1], 0);
    doc.setLineWidth(0.3);
    doc.roundedRect(sx, sy, sigW, sh, 2, 2, "S");
    doc.setLineDashPattern([], 0);
    doc.setLineWidth(0.2);

    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(label, sx + sigW / 2, sy + 5, { align: "center" });
  });
  y += sigOuterH + 5;

  // ──────────────────────────────────────────────
  // Bottom mint pill notice
  // ──────────────────────────────────────────────
  const noticeH = 9;
  if (y + noticeH > pageH - margin) {
    // fallback: place at bottom
    y = pageH - margin - noticeH;
  }
  doc.setFillColor(...MINT);
  doc.setDrawColor(...MINT_BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentW, noticeH, 2, 2, "FD");
  doc.setLineWidth(0.2);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(
    "Une copie de l'ordre de mission est remise au responsable des Ressources Humaines.",
    pageW / 2,
    y + noticeH / 2 + 1.2,
    { align: "center" }
  );

  // Footer micro line
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.text(`Généré le ${today} — ${ref}`, pageW - margin, pageH - 4, { align: "right" });
  doc.text("ERCMSA SALHI ADEL", margin, pageH - 4);

  // ── Save ──
  const equipeName = (equipe.chefEquipe || `Equipe-${equipeIndex + 1}`).replace(/\s+/g, "_");
  const dateStr = format(new Date(fiche.dateFiche || fiche.createdAt), "yyyy-MM-dd");
  doc.save(`Ordre_Mission_${equipeName}_${dateStr}.pdf`);
}
