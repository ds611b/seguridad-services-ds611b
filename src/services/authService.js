// src/services/authService.js

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sha256 } from '../utils/sha256.js'
import { Usuarios, Sesiones, UsuariosSesiones } from '../models/index.js'

const SALT_ROUNDS = 10

/**
 * Construye el payload JWT a partir del usuario.
 * @param {Object} user 
 * @param {number} user.id 
 * @param {number} user.rol_id 
 * @param {string} user.nombre
 * @param {string} user.apellido 
 * @param {string} user.email
 * @param {string} sesionId
 * @returns {Object}
 */
function buildPayload(user, sesionId) {
  return {
    uid: user.id,
    role: user.rol_id,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    sid: sesionId
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
  // Validación del formato del correo electrónico institucional
  const emailRegex = /^[\w.+-]+@itca\.edu\.sv$/;
  if (!emailRegex.test(email)) {
    throw {
      statusCode: 400,
      code: 'INVALID_EMAIL_FORMAT',
      message: 'El correo electrónico debe ser una dirección válida @itca.edu.sv'
    };
  }

  const existingUser = await Usuarios.findOne({ where: { email } });
  if (existingUser) {
    throw {
      statusCode: 409,
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'El correo electrónico ya está registrado'
    };
  }

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

  // Validación del formato del correo electrónico
  const emailRegex = /^[\w.+-]+@itca\.edu\.sv$/;
  if (!emailRegex.test(email)) {
    throw {
      statusCode: 400,
      code: 'INVALID_EMAIL_FORMAT',
      message: 'El correo electrónico debe ser una dirección válida @itca.edu.sv'
    };
  }

  const user = await Usuarios.findOne({ where: { email } });
  if (!user) return null

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null

  const sesion = await Sesiones.create({})
  const accessToken = fastify.jwt.sign(
    buildPayload(user, sesion.id)
  );

  //Refresh-token + hashes
  const refreshPlain = crypto.randomBytes(40).toString('hex');
  const refreshSha256 = sha256(refreshPlain);
  const refreshBcrypt = await bcrypt.hash(refreshPlain, SALT_ROUNDS);

  await UsuariosSesiones.create({
    token: refreshBcrypt,
    token_sha256: refreshSha256,
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
  const fila = await UsuariosSesiones.findOne({
    where: {
      token_sha256: sha256(refreshToken),
      revoked_at: null                      // sólo sesiones activas
    }
  })
  if (!fila) return null
  if (!(await bcrypt.compare(refreshToken, fila.token))) return null

  const user = await Usuarios.findByPk(fila.usuario_id)
  const newAccess = fastify.jwt.sign(
    buildPayload(user, fila.sesion_id),
    { expiresIn: ACCESS_EXPIRES }
  )
  return { accessToken: newAccess }
}

/**
 * Cierra la sesión de un usuario y elimina el refresh token.
 * @param {Object} data 
 * @param {string} data.refreshToken 
 * @returns {Promise<boolean>} 
 */
export async function logout({ refreshToken }) {
  const fila = await UsuariosSesiones.findOne({
    where: {
      token_sha256: sha256(refreshToken),
      revoked_at: null
    }
  })
  if (!fila) return false
  if (!(await bcrypt.compare(refreshToken, fila.token))) return false

  await Sesiones.update(
    { closed_at: new Date(), updated_at: new Date() },
    { where: { id: fila.sesion_id } }
  )

  await fila.update({ revoked_at: new Date(), updated_at: new Date() })
  return true
}

export async function requestReset(email, fastify) {
  const user = await Usuarios.findOne({ where: { email } })
  if (!user) return null

  // Crear token de 30 min solo para reset.
  const resetToken = fastify.jwt.sign(
    { uid: user.id, pwd_reset: true },
    { expiresIn: '30m' }
  )
  return resetToken
}

export async function resetPassword(token, newPassword, fastify) {
  try {
    // 1. Verificar token
    const payload = await fastify.jwt.verify(token)
    if (!payload.pwd_reset) throw new Error('invalid')

    // 2. Cambiar contraseña
    const hash = await bcrypt.hash(newPassword, 10)
    await Usuarios.update(
      { password_hash: hash },
      { where: { id: payload.uid } }
    )
    return true
  } catch (err) {
    return false
  }
}
