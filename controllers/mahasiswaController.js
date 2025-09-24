// controller mahasiswa
const db = require("../models");
const Mahasiswa = db.Mahasiswa;
const xlsx = require("xlsx");
const fs = require("fs");

module.exports = {
  addMahasiswa: async (req, res) => {
    try {
      const { nim, nama, angkatan } = req.body;

      if (!nim || !nama || !angkatan) {
        return res.status(400).send({ msg: "All fields required" });
      }

      const result = await Mahasiswa.create({
        nim,
        nama,
        angkatan,
      });

      res.status(200).send({
        msg: "Mahasiswa berhasil ditambahkan",
        data: result,
      });
    } catch (error) {
      console.log(error);
      res.status(400).send(error);
    }
  },
  allMahasiswa: async (req, res) => {
    try {
      const { nim } = req.query; // 🔥 pakai query, bukan params

      const whereClause = nim ? { nim } : {}; // kalau ada nim filter, kalau tidak kosong (ambil semua)

      const result = await Mahasiswa.findAll({ where: whereClause });

      if (result.length === 0) {
        return res.status(404).send({
          msg: nim ? `Mahasiswa dengan NIM ${nim} tidak ditemukan` : "Tidak ada data mahasiswa",
          data: [],
        });
      }

      res.status(200).send({
        msg: nim ? "Mahasiswa berhasil ditemukan" : "Semua data mahasiswa berhasil ditampilkan",
        data: result,
      });
    } catch (error) {
      console.error("allMahasiswa error:", error.message || error);
      res.status(500).send({ message: "Internal server error" });
    }
  },
  uploadExcel: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ msg: "File Excel diperlukan" });
      }

      const workbook = xlsx.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      // ambil data dalam bentuk array of rows
      const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      if (raw.length <= 1) {
        fs.unlinkSync(req.file.path);
        return res.status(400).send({ msg: "File Excel kosong" });
      }

      // normalisasi header
      const headers = raw[0].map(h => h.toString().toLowerCase().trim());

      // mapping header ke field standar
      const headerMap = {};
      headers.forEach((h, i) => {
        if (["nim", "NIM"].includes(h)) headerMap.nim = i;
        if (["nama", "NAMA", "nama mahasiswa", "NAMA MAHASISWA"].includes(h)) headerMap.nama = i;
        if (["angkatan", "ANGKATAN"].includes(h)) headerMap.angkatan = i;
      });

      const mode = req.query.mode === "strict" ? "strict" : "partial";
      let inserted = [];
      let errors = [];

      // iterasi baris mulai dari row ke-2 (karena row 1 = header)
      for (let i = 1; i < raw.length; i++) {
        const row = raw[i];
        const rowNumber = i + 1; // human readable (Excel row number)

        const nim = row[headerMap.nim];
        const nama = row[headerMap.nama];
        const angkatan = row[headerMap.angkatan];

        if (!nim || !nama || !angkatan) {
          errors.push(`Row ${rowNumber}: nim, nama, angkatan wajib diisi`);
          if (mode === "strict") break;
          continue;
        }

        if (isNaN(nim)) {
          errors.push(`Row ${rowNumber}: NIM harus berupa angka`);
          if (mode === "strict") break;
          continue;
        }

        inserted.push({
          nim: nim.toString(),
          nama: nama.toString(),
          angkatan: angkatan.toString(),
        });
      }

      // kalau strict mode dan ada error → jangan insert apapun
      if (mode === "strict" && errors.length > 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).send({
          msg: "Import dibatalkan karena ada error",
          errors,
        });
      }

      // insert data valid ke DB
      const result = await Mahasiswa.bulkCreate(inserted);

      fs.unlinkSync(req.file.path);

      res.status(200).send({
        msg: `${result.length} mahasiswa berhasil ditambahkan`,
        inserted: result,
        errors: errors,
        mode: mode,
      });
    } catch (error) {
      console.error("uploadExcel error:", error);
      res.status(500).send({
        msg: "Gagal import Excel",
        error: error.original?.sqlMessage || error.message || error
      });
    }
  },
};
