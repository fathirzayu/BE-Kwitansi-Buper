'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Kwitansi extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Kwitansi.init({
    nim: DataTypes.INTEGER,
    nama: DataTypes.STRING,
    angkatan: DataTypes.INTEGER,
    jenis_bayar: DataTypes.STRING,
    cara_bayar: DataTypes.STRING,
    nominal: DataTypes.STRING,
    keterangan_bayar: DataTypes.STRING,
    terbilang: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Kwitansi',
  });
  return Kwitansi;
};