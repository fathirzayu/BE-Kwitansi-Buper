const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const path = require("path");

// ================== Constants ==================
const EXCEL_CONFIG = {
  HEADER_STYLE: {
    font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
    fill: { fgColor: { rgb: "4472C4" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  },
  COLUMN_WIDTHS: [
    { wch: 6 },   // No
    { wch: 14 },  // Tanggal Bayar
    { wch: 16 },  // NIM
    { wch: 30 },  // Nama
    { wch: 12 },  // Angkatan
    { wch: 20 },  // Jenis Bayar
    { wch: 15 },  // Cara Bayar
    { wch: 18 },  // Nominal
  ],
};

const PDF_CONFIG = {
  PAGE: {
    size: "A4",
    layout: "landscape",
    margin: 40,
  },
  COLORS: {
    headerBg: "#4472C4",
    headerText: "#FFFFFF",
    alternateRow: "#F2F2F2",
    border: "#CCCCCC",
  },
  TABLE: {
    rowHeight: 25,
    colWidths: [30, 90, 75, 160, 60, 120, 85, 120],
    padding: { x: 6, y: 5 },
    fontSize: 9,
    headerFontSize: 10,
  },
  LOGO: {
    path: "./public/buper.png",
    width: 60,
    x: 45,
    y: 30,
  },
};

// ================== Helper Functions ==================

/**
 * Format date to DD-MM-YYYY
 */
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Format currency to Indonesian Rupiah
 */
const formatCurrency = (amount) => {
  if (!amount) return "Rp 0";
  const numAmount = typeof amount === "string" ? parseFloat(amount.replace(/[^\d]/g, "")) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(numAmount);
};

/**
 * Generate filename with date range or current date
 */
const generateFileName = (prefix, startDate, endDate, extension) => {
  let dateStr;
  if (startDate && endDate) {
    dateStr = `${formatDate(startDate)}_sampai_${formatDate(endDate)}`;
  } else {
    dateStr = formatDate(new Date());
  }
  return `${prefix}_${dateStr}.${extension}`;
};

/**
 * Validate data array
 */
const validateData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Data is empty or invalid");
  }
  return true;
};

// ================== Excel Export ==================

/**
 * Export data to Excel with enhanced styling
 */
const exportToExcel = (data, startDate, endDate) => {
  try {
    validateData(data);

    // Prepare headers
    const headers = [
      "No",
      "Tanggal Bayar",
      "NIM",
      "Nama",
      "Angkatan",
      "Jenis Bayar",
      "Cara Bayar",
      "Nominal",
    ];

    // Add title and date info
    const title = [["DATA KWITANSI PEMBAYARAN"]];
    const dateInfo = [[`Tanggal Cetakan: ${formatDate(new Date())}`]];
    if (startDate && endDate) {
      dateInfo.push([`Periode: ${formatDate(startDate)} s/d ${formatDate(endDate)}`]);
    }
    const blank = [[]];

    // Prepare data rows
    const rows = data.map((item, index) => [
      index + 1,
      item["Tanggal Bayar"] || "",
      item.NIM || "",
      item.Nama || "",
      item.Angkatan || "",
      item["Jenis Bayar"] || "",
      item["Cara Bayar"] || "",
      formatCurrency(item["Nominal"]),
    ]);

    // Combine all data
    const wsData = [...title, ...dateInfo, blank, headers, ...rows];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Style title (row 0)
    const titleCell = ws["A1"];
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, size: 16, color: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    // Merge title across columns
    const headerRowIndex = dateInfo.length + 2; // Adjust for title and date rows
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Title merge
    ];

    // Style header row
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
      const cell = ws[cellAddress];
      if (cell) {
        cell.s = EXCEL_CONFIG.HEADER_STYLE;
      }
    }

    // Style data cells with borders
    for (let R = headerRowIndex + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (cell) {
          cell.s = {
            alignment: { vertical: "center", horizontal: C === 0 ? "center" : "left" },
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } },
            },
          };
        }
      }
    }

    // Set column widths
    ws["!cols"] = EXCEL_CONFIG.COLUMN_WIDTHS;

    // Freeze header row
    ws["!freeze"] = { xSplit: 0, ySplit: headerRowIndex + 1 };

    // Set row heights
    ws["!rows"] = [
      { hpt: 25 }, // Title
      { hpt: 15 }, // Date info
      ...(startDate && endDate ? [{ hpt: 15 }] : []), // Period info
      { hpt: 5 },  // Blank
      { hpt: 20 }, // Header
    ];

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Data Kwitansi");

    // Generate buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const fileName = generateFileName("Data_Kwitansi", startDate, endDate, "xlsx");

    return { buf, fileName };
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw new Error(`Failed to export Excel: ${error.message}`);
  }
};

// ================== PDF Export ==================

/**
 * Export data to PDF with enhanced styling
 */
const exportToPDF = (data, startDate, endDate) => {
  try {
    validateData(data);

    const doc = new PDFDocument(PDF_CONFIG.PAGE);
    const fileName = generateFileName("Data_Kwitansi", startDate, endDate, "pdf");

    const config = PDF_CONFIG.TABLE;
    const totalTableWidth = config.colWidths.reduce((a, b) => a + b, 0);

    // Helper: Get centered X position for table
    const getStartX = () => {
      return (
        doc.page.margins.left +
        (doc.page.width - doc.page.margins.left - doc.page.margins.right - totalTableWidth) / 2
      );
    };

    // Helper: Calculate text height with word wrap
    const getTextHeight = (text, width, fontSize = config.fontSize) => {
      doc.fontSize(fontSize);
      return doc.heightOfString(String(text), {
        width: width - config.padding.x * 2,
        align: "left",
      });
    };

    // Helper: Draw a table cell
    const drawCell = (text, x, y, width, height, options = {}) => {
      const {
        bold = false,
        fillColor = null,
        textColor = "black",
        fontSize = config.fontSize,
        align = "left",
      } = options;

      // Draw cell background and border
      if (fillColor) {
        doc.rect(x, y, width, height).fillAndStroke(fillColor, PDF_CONFIG.COLORS.border);
      } else {
        doc.rect(x, y, width, height).lineWidth(0.5).stroke(PDF_CONFIG.COLORS.border);
      }

      // Draw text
      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(fontSize)
        .fillColor(textColor)
        .text(String(text), x + config.padding.x, y + config.padding.y, {
          width: width - config.padding.x * 2,
          align: align,
        });
    };

    // Helper: Draw header row
    const drawHeader = (y) => {
      const headers = [
        "No",
        "Tanggal Bayar",
        "NIM",
        "Nama",
        "Angkatan",
        "Jenis Bayar",
        "Cara Bayar",
        "Nominal",
      ];

      let x = getStartX();
      const headerHeight = 25;

      headers.forEach((header, i) => {
        drawCell(header, x, y, config.colWidths[i], headerHeight, {
          bold: true,
          fillColor: PDF_CONFIG.COLORS.headerBg,
          textColor: PDF_CONFIG.COLORS.headerText,
          fontSize: config.headerFontSize,
          align: "center",
        });
        x += config.colWidths[i];
      });

      return y + headerHeight;
    };

    // Draw document header
    const drawDocHeader = () => {
      // Logo
      try {
        if (require("fs").existsSync(PDF_CONFIG.LOGO.path)) {
          doc.image(PDF_CONFIG.LOGO.path, PDF_CONFIG.LOGO.x, PDF_CONFIG.LOGO.y, {
            width: PDF_CONFIG.LOGO.width,
          });
        }
      } catch (err) {
        console.warn("Logo not found, skipping...");
      }

      // Title
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor(PDF_CONFIG.COLORS.headerBg)
        .text("DATA KWITANSI PEMBAYARAN", 0, 45, { align: "center" });

      // Subtitle
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("black")
        .text(`Tanggal Cetakan: ${formatDate(new Date())}`, { align: "center" });

      if (startDate && endDate) {
        doc.text(`Periode: ${formatDate(startDate)} s/d ${formatDate(endDate)}`, {
          align: "center",
        });
      }

      doc.moveDown(1);
    };

    // Draw initial header
    drawDocHeader();

    // Start table
    let y = 120;
    y = drawHeader(y);

    // Draw data rows
    data.forEach((item, index) => {
      const row = [
        index + 1,
        item["Tanggal Bayar"] || "",
        item.NIM || "",
        item.Nama || "",
        item.Angkatan || "",
        item["Jenis Bayar"] || "",
        item["Cara Bayar"] || "",
        formatCurrency(item["Nominal"]),
      ];

      // Calculate row height based on content
      const cellHeights = row.map((text, i) => getTextHeight(text, config.colWidths[i]));
      const rowHeight = Math.max(...cellHeights) + config.padding.y * 2;

      // Check if we need a new page
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 40) {
        doc.addPage(PDF_CONFIG.PAGE);
        y = 60;
        y = drawHeader(y);
      }

      // Draw row cells
      let x = getStartX();
      const fillColor = index % 2 === 0 ? PDF_CONFIG.COLORS.alternateRow : null;

      row.forEach((text, i) => {
        drawCell(text, x, y, config.colWidths[i], rowHeight, {
          fillColor: fillColor,
          align: i === 0 ? "center" : "left",
        });
        x += config.colWidths[i];
      });

      y += rowHeight;
    });

    // Draw summary footer
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("black")
      .text(`Total Data: ${data.length} kwitansi`, getStartX(), y + 15);

    // Add page numbers to all pages
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("gray")
        .text(
          `Halaman ${i + 1} dari ${pageCount}`,
          doc.page.margins.left,
          doc.page.height - 30,
          { align: "center", width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
        );
    }

    return { doc, fileName };
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
};

// ================== Exports ==================

module.exports = {
  exportToExcel,
  exportToPDF,
  formatDate,
  formatCurrency,
};