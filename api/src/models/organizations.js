'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class organizations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      organizations.hasMany(models.Project,{
        foreignKey : "organization_id",
        as : "projects"
      })


        organizations.hasMany(models.org_members, {
    foreignKey: "organization_id",
    onDelete: "CASCADE"
    // CASCADE: membership records are meaningless without the organization
  })

  
    }
  }
  organizations.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'organizations',
  });
  return organizations;
};