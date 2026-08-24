'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
  Task.belongsTo(models.Project, {
    foreignKey: "project_id",
    as: "Project",
    onDelete: "CASCADE"
  
  })

  Task.hasMany(models.TaskAssignment, {
    foreignKey: "task_id",
    onDelete: "CASCADE"
  })

    }
  }
  Task.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    status: DataTypes.STRING,
    priority: DataTypes.STRING,
    due_date: DataTypes.DATE,
    project_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Task',
  });
  return Task;
};