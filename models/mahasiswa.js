'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Mahasiswa extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Mahasiswa.init({
    nim: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    angkatan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Mahasiswa',
  });
  return Mahasiswa;
};