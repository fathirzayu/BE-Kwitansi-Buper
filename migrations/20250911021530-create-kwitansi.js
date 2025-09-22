'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Kwitansis', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nim: {
        type: Sequelize.INTEGER
      },
      nama: {
        type: Sequelize.STRING
      },
      angkatan: {
        type: Sequelize.INTEGER
      },
      jenis_bayar: {
        type: Sequelize.STRING
      },
      cara_bayar: {
        type: Sequelize.STRING
      },
      nominal: {
        type: Sequelize.STRING
      },
      keterangan_bayar: {
        type: Sequelize.STRING
      },
      terbilang: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Kwitansis');
  }
};