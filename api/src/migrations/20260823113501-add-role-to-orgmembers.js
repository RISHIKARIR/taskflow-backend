'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('org_members','role',{
      type : Sequelize.ENUM("org_admin","member"),
      allowNull : false,
      defaultValue : "member"
    })
  },

  async down (queryInterface, Sequelize) {
  await queryInterface.removeColumn('org_members','role');
  }
};
