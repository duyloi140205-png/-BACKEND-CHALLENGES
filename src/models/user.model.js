  const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'instructor', 'student'),
    allowNull: false,
    defaultValue: 'student'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

const UserAuth = sequelize.define('UserAuth', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
    otp_code: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
    otp_expiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
}, {
  tableName: 'user_auths',
  timestamps: true,
  underscored: true
});

// Relationships
User.hasOne(UserAuth, { foreignKey: 'user_id', as: 'auth' });
UserAuth.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { User, UserAuth };
