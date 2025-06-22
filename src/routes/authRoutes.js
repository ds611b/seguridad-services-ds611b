// src/routes/authRoutes.js
import { register, login, refresh, logout } from '../services/authService.js'
import { Type } from '@sinclair/typebox'

export default async function (fastify) {
  const RegisterBody = Type.Object({
    nombre: Type.String({ maxLength: 100 }),
    apellido: Type.String({ maxLength: 100 }),
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8 }),
    rol_id: Type.Integer()
  })

  /** ---------- REGISTER ---------- */
  fastify.post('/auth/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Crear cuenta',
      body: RegisterBody,
      response: { 201: Type.Object({ id: Type.Integer() }) }
    }
  }, async (req, reply) => {
    const user = await register(req.body)
    reply.code(201).send({ id: user.id })
  })

  /** ---------- LOGIN ---------- */
  fastify.post('/auth/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Iniciar sesión',
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String()
      }),
      response: {
        200: Type.Object({
          accessToken: Type.String(),
          refreshToken: Type.String()
        })
      }
    }
  }, async (req, reply) => {
    const tokens = await login(req.body, fastify)
    if (!tokens) return reply.unauthorized()
    reply.send(tokens)
  })

  /** ---------- REFRESH TOKEN ---------- */
  fastify.post('/auth/refresh', {
    schema: {
      tags: ['Auth'],
      summary: 'Renovar access token',
      body: Type.Object({ refreshToken: Type.String() }),
      response: { 200: Type.Object({ accessToken: Type.String() }) }
    }
  }, async (req, reply) => {
    const data = await refresh(req.body, fastify)
    if (!data) return reply.unauthorized()
    reply.send(data)
  })

  /* ---------- LOGOUT ---------- */
  fastify.post('/auth/logout', {
    schema: {
      tags: ['Auth'],
      summary: 'Cerrar sesión (revocar refresh-token)',
      body: Type.Object({ refreshToken: Type.String() }),
      response: { 200: Type.Object({ success: Type.Boolean() }) }
    }
  }, async (req, reply) => {
    const ok = await logout(req.body)
    if (!ok) return reply.unauthorized()
    reply.send({ success: true })
  })

  /* ---------- ME / CHECK TOKEN ---------- */
  fastify.get('/auth/me', {
    schema: {
      tags: ['Auth'],
      summary: 'Devuelve el payload del access token',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          uid: Type.Integer(),
          role: Type.Integer(),
          nombre: Type.String(),
          email: Type.String({ format: 'email' }),
          iat: Type.Optional(Type.Integer()),
          exp: Type.Optional(Type.Integer())
        })
      }
    },
    preHandler: [fastify.authenticate]
  }, async (req, reply) => {
    // fastify.jwtVerify() ya cargó el payload en request.user
    reply.send(req.user)
  })
}
