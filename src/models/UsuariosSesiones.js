// models/UsuariosSesiones.js
import { DataTypes } from 'sequelize'
import sequelize from './db.js'

const UsuariosSesiones = sequelize.define('UsuariosSesiones', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sesion_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  token_sha256: {
    type: DataTypes.CHAR(64),
    allowNull: false,
    unique: true
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'UsuariosSesiones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default UsuariosSesiones
