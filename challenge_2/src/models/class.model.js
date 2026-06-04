const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Course = require('./course.model');

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  max_students: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  tableName: 'classes',
  timestamps: true,
});

Course.hasMany(Class, { foreignKey: 'course_id' });
Class.belongsTo(Course, { foreignKey: 'course_id' });

module.exports = Class;