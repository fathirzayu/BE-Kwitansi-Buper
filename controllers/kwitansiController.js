const { Op } = require("sequelize");
const db = require("../models");
const Kwitansi = db.Kwitansi;
const { exportToPDF, exportToExcel } = require("../helper/export");

module.exports = {
  createKwitansi: async (req, res) => {
    try {
      const {
        nim,
        nama,
        angkatan,
        jenisBayar,
        caraBayar,
        tanggalBayar,
        nominal,
        keteranganBayar,
        terbilang,
      } = req.body;

      if (!nim || !nama || !angkatan || !jenisBayar || !caraBayar || !tanggalBayar || !nominal || !keteranganBayar || !terbilang) {
        return res.status(400).send({
          msg: "Semua field wajib diisi",
          status: false,
        });
      }

      const result = await Kwitansi.create({
        nim,
        nama,
        angkatan,
        jenis_bayar : jenisBayar,
        cara_bayar : caraBayar,
        tanggal_bayar : tanggalBayar,
        nominal,
        keterangan_bayar : keteranganBayar,
        terbilang,
      });

      res.status(201).send({
        msg: "Kwitansi berhasil dibuat",
        status: true,
        data: result,
      });
    } catch (error) {
      console.log(error);
      res.status(400).send(error);
    }
  },
  getAllKwitansi: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const offset = (page - 1) * limit;

      const search = req.query.search || "";
      const sort = req.query.sort || "tanggal_bayar";
      const order = req.query.order === "desc" ? "DESC" : "ASC";

      const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

      let filter = {};

      // filter search
      if (search) {
        filter = {
          ...filter,
          [Op.or]: [
            { nim: { [Op.like]: `%${search}%` } },
            { nama: { [Op.like]: `%${search}%` } },
          ],
        };
      }

      // filter date range (dari react-day-picker)
      if (startDate && endDate) {
        // endDate diubah menjadi 23:59:59.999 supaya mencakup seluruh hari
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setHours(23, 59, 59, 999);

        filter = {
          ...filter,
          tanggal_bayar: {
            [Op.between]: [startDate, adjustedEndDate],
          },
        };
      }

      // query sequelize
      const { rows, count } = await Kwitansi.findAndCountAll({
        where: filter,
        limit,
        offset,
        order: [[sort, order]],
      });

      if (rows.length === 0) {
        return res.status(404).send({
          status: false,
          msg: "Data kwitansi tidak ditemukan",
          data: [],
        });
      }

      res.status(200).send({
        status: true,
        msg: "Data kwitansi berhasil diambil",
        page,
        totalPages: Math.ceil(count / limit),
        totalData: count,
        data: rows,
      });
    } catch (error) {
      console.error("getAllKwitansi error:", error.message || error);
      res.status(500).send({ status: false, msg: "Internal server error" });
    }
  },
  exportKwitansi: async (req, res) => {
    try {
      const search = req.query.search || "";
      const sort = req.query.sort || "tanggal_bayar";
      const order = req.query.order === "desc" ? "DESC" : "ASC";
      const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
      const type = req.query.type || "excel";

      let filter = {};
      if (search) {
        filter = {
          ...filter,
          [Op.or]: [
            { nim: { [Op.like]: `%${search}%` } },
            { nama: { [Op.like]: `%${search}%` } },
          ],
        };
      }
      if (startDate && endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setHours(23, 59, 59, 999);
        filter = { ...filter, tanggal_bayar: { [Op.between]: [startDate, adjustedEndDate] } };
      }

      const data = await Kwitansi.findAll({ where: filter, order: [[sort, order]] });

      if (!data.length) {
        return res.status(404).send({ status: false, msg: "Data kwitansi tidak ditemukan" });
      }

      const exportData = data.map((item) => ({
        "Tanggal Bayar": item.tanggal_bayar
        ? new Date(item.tanggal_bayar).toLocaleDateString("id-ID")
        : "-",
        NIM: item.nim,
        Nama: item.nama,
        Angkatan: item.angkatan,
        "Jenis Bayar": item.jenis_bayar,
        "Cara Bayar": item.cara_bayar,
        Tanggal_Bayar: item.tanggal_bayar,
        "Keterangan Bayar": item.keterangan_bayar,
        Nominal: item.nominal,
        Terbilang: item.terbilang,
      }));

      if (type === "pdf") {
        const { doc, fileName } = exportToPDF(exportData, startDate, endDate);
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);
        doc.end();
      } else {
        const { buf, fileName } = exportToExcel(exportData, startDate, endDate);
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(buf);
      }
    } catch (error) {
      console.error("exportKwitansi error:", error.message || error);
      res.status(500).send({ status: false, msg: "Internal server error" });
    }
  },
};