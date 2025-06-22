// src/services/authService.js
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Usuarios, Sesiones, UsuariosSesiones } from '../models/index.js'

const SALT_ROUNDS = 10

function buildPayload (user) {
  return {
    uid:   user.id,
    role:  user.rol_id,
    nombre: user.nombre,
    email:  user.email
  }
}

export async function register({ nombre, apellido, email, password, rol_id }) {
  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await Usuarios.create({ nombre, apellido, email, password_hash: hash, rol_id })
  return user
}

// ---------- LOGIN ----------
export async function login ({ email, password }, fastify) {
  const user = await Usuarios.findOne({ where: { email } })
  if (!user) return null

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return null

  const sesion = await Sesiones.create({})

  const accessToken  = fastify.jwt.sign(buildPayload(user))
  const refreshPlain = crypto.randomBytes(40).toString('hex')
  const refreshHash  = await bcrypt.hash(refreshPlain, SALT_ROUNDS)

  await UsuariosSesiones.create({
    token: refreshHash,
    usuario_id: user.id,
    sesion_id: sesion.id
  })

  return { accessToken, refreshToken: refreshPlain }
}

// ---------- REFRESH ----------
export async function refresh ({ refreshToken }, fastify) {
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

// ---------- LOGOUT ----------
export async function logout ({ refreshToken }) {
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