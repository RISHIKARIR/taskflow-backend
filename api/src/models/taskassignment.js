'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TaskAssignment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      TaskAssignment.belongsTo(models.Task, {
        foreignKey: "task_id",
        onDelete : "CASCADE"
      })

      TaskAssignment.belongsTo(models.users, {
        foreignKey: "user_id",
        onDelete : "CASCADE"

      })


    }
  }
  TaskAssignment.init({
    task_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'TaskAssignment',
  });
  return TaskAssignment;
};