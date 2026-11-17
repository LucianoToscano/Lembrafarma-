'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('usuarios', 'cnpj', {
      type: Sequelize.STRING(14),
      allowNull: true
    });

    await queryInterface.addIndex('usuarios', ['cnpj'], {
      unique: true,
      name: 'uq_usuarios_cnpj'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('usuarios', 'uq_usuarios_cnpj');
    await queryInterface.removeColumn('usuarios', 'cnpj');
  }
};
