const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { User } = require('./user.model');
const Class = require('./class.model');

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'classes',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  enrolled_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'enrollments',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'class_id'],
    },
  ],
});

// Relationships
User.hasMany(Enrollment, { foreignKey: 'user_id', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'user_id', as: 'student' });

Class.hasMany(Enrollment, { foreignKey: 'class_id', as: 'enrollments' });
Enrollment.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });

module.exports = Enrollment;
