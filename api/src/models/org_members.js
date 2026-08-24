'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class org_members extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      org_members.belongsTo(models.users,{
        foreignKey : "user_id",
        onDelete : "CASCADE"
      })
      org_members.belongsTo(models.organizations,{
        foreignKey : 'organization_id',
        onDelete : "CASCADE"
      })


    }
  }
  org_members.init({
    user_id: DataTypes.INTEGER,
    organization_id: DataTypes.INTEGER,
  role: DataTypes.ENUM('org_admin', 'member'),
  }, {
    sequelize,
    modelName: 'org_members',
  });
  return org_members;
};