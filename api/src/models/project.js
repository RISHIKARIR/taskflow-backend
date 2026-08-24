'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        Project.belongsTo(models.organizations,{
    foreignKey : "organization_id",
    as : "organization"
    })   

    Project.hasMany(models.Task,{
        foreignKey : "project_id",
        as : "Tasks"
    })


    

    }
  }
  Project.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    organization_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Project',
  });
  return Project;
};