// src/services/authService.js

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Usuarios, Sesiones, UsuariosSesiones } from '../models/index.js'

const SALT_ROUNDS = 10

/**
 * Construye el payload JWT a partir del usuario.
 * @param {Object} user 
 * @param {number} user.id 
 * @param {number} user.rol_id 
 * @param {string} user.nombre 
 * @param {string} user.email 
 * @returns {Object}
 */
function buildPayload(user) {
  return {
    uid: user.id,
    role: user.rol_id,
    nombre: user.nombre,
    email: user.email
  }
}

/**
 * Registra un nuevo usuario.
 * @param {Object} data 
 * @param {string} data.nombre 
 * @param {string} data.apellido 
 * @param {string} data.email 
 * @param {string} data.password 
 * @param {number} data.rol_id 
 * @returns {Promise<Object>}
 */
export async function register({ nombre, apellido, email, password, rol_id }) {
  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await Usuarios.create({ nombre, apellido, email, password_hash: hash, rol_id })
  return user
}

/**
 * Inicia sesión para un usuario.
 * @param {Object} credentials 
 * @param {string} credentials.email 
 * @param {string} credentials.password 
 * @param {Object} fastify 
 * @returns {Promise<Object|null>} 
 */
export async function login({ email, password }, fastify) {
  const user = await Usuarios.findOne({ where: { email } })
  if (!user) return null

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return null

  const sesion = await Sesiones.create({})

  const accessToken = fastify.jwt.sign(buildPayload(user))
  const refreshPlain = crypto.randomBytes(40).toString('hex')
  const refreshHash = await bcrypt.hash(refreshPlain, SALT_ROUNDS)

  await UsuariosSesiones.create({
    token: refreshHash,
    usuario_id: user.id,
    sesion_id: sesion.id
  })

  return { accessToken, refreshToken: refreshPlain }
}

/**
 * Genera un nuevo access token a partir de un refresh token válido.
 * @param {Object} data 
 * @param {string} data.refreshToken
 * @param {Object} fastify 
 * @returns {Promise<Object|null>} 
 */
export async function refresh({ refreshToken }, fastify) {
  const filas = await UsuariosSesiones.findAll()
  for (const fila of filas) {
    if (await bcrypt.compare(refreshToken, fila.token)) {
      const user = await Usuarios.findByPk(fila.usuario_id)
      const newAccess = fastify.jwt.sign(buildPayload(user))
      return { accessToken: newAccess }
    }
  }
  return null
}

/**
 * Cierra la sesión de un usuario y elimina el refresh token.
 * @param {Object} data 
 * @param {string} data.refreshToken 
 * @returns {Promise<boolean>} 
 */
export async function logout({ refreshToken }) {
  const filas = await UsuariosSesiones.findAll()
  for (const fila of filas) {
    if (await bcrypt.compare(refreshToken, fila.token)) {
      await Sesiones.update(
        { closed_at: new Date(), updated_at: new Date() },
        { where: { id: fila.sesion_id } }
      )
      await fila.destroy()
      return true
    }
  }
  return false
}
