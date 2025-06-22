// models/Sesiones.js
import { DataTypes } from 'sequelize'
import sequelize from './db.js'

const Sesiones = sequelize.define('Sesiones', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  closed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'Sesiones',
  timestamps: false
})

export default Sesiones
