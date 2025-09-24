const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const fs = require("fs");

// Helper format tanggal
const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// ================== Excel ==================
const exportToExcel = (data, startDate, endDate) => {
  const wsData = [
    ["No", "Tanggal", "NIM", "Nama", "Angkatan", "Jenis Bayar", "Cara Bayar", "Nominal"]
  ];

  data.forEach((item, index) => {
    wsData.push([
      index + 1,
      item.Tanggal,
      item.NIM,
      item.Nama,
      item.Angkatan,
      item["Jenis Bayar"],
      item["Cara Bayar"],
      item["Nominal"],
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Styling header
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (!cell.s) cell.s = {};
    cell.s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } },
      alignment: { horizontal: "center" }
    };
  }

  ws['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }; // Freeze header

  XLSX.utils.book_append_sheet(wb, ws, "Kwitansi");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  let fileDate = startDate && endDate ? `${formatDate(startDate)}_sampai_${formatDate(endDate)}` : formatDate(new Date());

  return { buf, fileName: `Data_Kwitansi_${fileDate}.xlsx` };
};

// ================== PDF ==================
const exportToPDF = (data, startDate, endDate) => {
  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });

  let fileDate =
    startDate && endDate
      ? `${formatDate(startDate)}_sampai_${formatDate(endDate)}`
      : formatDate(new Date());
  const fileName = `Data_Kwitansi_${fileDate}.pdf`;

  // Stream output ke file (opsional, bisa juga pipe ke response)
  doc.pipe(fs.createWriteStream(fileName));

  // Header
  doc.image("./public/buper.png", 40, 30, { width: 50 });
  doc.fontSize(18).text("Data Kwitansi", 0, 40, { align: "center" });
  doc.fontSize(10).text(`Tanggal : ${formatDate(new Date())}`, {
    align: "center",
  });
  doc.moveDown(1.5);

  // Table setup
  const tableTop = 100;
  const rowHeight = 25;
  const colWidths = [25, 70, 90, 160, 60, 120, 80, 120]; 
  const headers = [
    "No",
    "Tanggal",
    "NIM",
    "Nama",
    "Angkatan",
    "Jenis Bayar",
    "Cara Bayar",
    "Nominal",
  ];
  const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);

  const getStartX = () =>
    doc.page.margins.left +
    (doc.page.width -
      doc.page.margins.left -
      doc.page.margins.right -
      totalTableWidth) /
      2;

  // Hitung tinggi teks untuk wrap
  const getTextHeight = (text, width, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    return doc.heightOfString(String(text), {
      width: width - 12, // padding kiri-kanan 6
      align: "left",
    });
  };

  const drawCell = (
    text,
    x,
    y,
    width,
    height,
    bold = false,
    fillColor = null
  ) => {
    const paddingX = 6,
      paddingY = 4;
    if (fillColor) {
      doc.rect(x, y, width, height).fillAndStroke(fillColor, "black");
      doc.fillColor("black");
    } else {
      doc.rect(x, y, width, height).stroke();
    }
    doc.font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(9)
      .fillColor("black")
      .text(String(text), x + paddingX, y + paddingY, {
        width: width - paddingX * 2,
        align: "left",
      });
  };

  const drawHeader = (y) => {
    let x = getStartX();
    headers.forEach((header, i) => {
      const h = getTextHeight(header, colWidths[i], true) + 8; 
      drawCell(header, x, y, colWidths[i], h, true, "#4F81BD");
      x += colWidths[i];
    });
    return y + 25; // rata-rata tinggi header
  };

  let y = tableTop;
  y = drawHeader(y);

  data.forEach((item, index) => {
    let x = getStartX();
    const row = [
      index + 1,
      item.Tanggal,
      item.NIM,
      item.Nama,
      item.Angkatan,
      item["Jenis Bayar"],
      item["Cara Bayar"],
      item["Nominal"],
    ];

    // Cari tinggi baris maksimum
    const cellHeights = row.map((text, i) =>
      getTextHeight(text, colWidths[i])
    );
    const rowHeight = Math.max(...cellHeights) + 8; // padding atas bawah

    const rowFill = index % 2 === 0 ? "#DCE6F1" : null;

    row.forEach((text, i) => {
      drawCell(text, x, y, colWidths[i], rowHeight, false, rowFill);
      x += colWidths[i];
    });

    y += rowHeight;

    // Page break jika melewati bawah
    if (y > doc.page.height - doc.page.margins.bottom - 30) {
      doc.addPage({ layout: "landscape" });
      y = tableTop;
      y = drawHeader(y);
    }
  });

  // Footer page number
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .text(
        `Page ${i + 1} of ${pageCount}`,
        doc.page.width - 100,
        doc.page.height - 30,
        { align: "right" }
      );
  }

  doc.end();
  return { doc, fileName };
};

module.exports = { exportToExcel, exportToPDF };
