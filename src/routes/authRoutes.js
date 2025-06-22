import { register, login, refresh, logout, requestReset, resetPassword } from '../services/authService.js'
import { Type } from '@sinclair/typebox'

export default async function (fastify) {
  // Esquema para el cuerpo de solicitud en /auth/register
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
      response: {
        201: Type.Object({
          id: Type.Integer()
        })
      }
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
      body: Type.Object({
        refreshToken: Type.String()
      }),
      response: {
        200: Type.Object({
          accessToken: Type.String()
        })
      }
    }
  }, async (req, reply) => {
    const data = await refresh(req.body, fastify)
    if (!data) return reply.unauthorized()
    reply.send(data)
  })

  /** ---------- LOGOUT ---------- */
  fastify.post('/auth/logout', {
    schema: {
      tags: ['Auth'],
      summary: 'Cerrar sesión (revocar refresh-token)',
      body: Type.Object({
        refreshToken: Type.String()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean()
        })
      }
    }
  }, async (req, reply) => {
    const ok = await logout(req.body)
    if (!ok) return reply.unauthorized()
    reply.send({ success: true })
  })

  /** ---------- ME (Check Token) ---------- */
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
          iat: Type.Optional(Type.Integer()), // issued at
          exp: Type.Optional(Type.Integer())  // expiration
        })
      }
    },
    preHandler: [fastify.authenticate] // Middleware que verifica el token
  }, async (req, reply) => {
    // El middleware fastify.authenticate ya agregó el payload a req.user
    reply.send(req.user)
  });

  /* ---------- REQUEST-RESET ---------- */
  fastify.post('/auth/request-reset', {
    schema: {
      tags: ['Auth'],
      summary: 'Genera token para restablecer contraseña (sin e-mail)',
      body: Type.Object({ email: Type.String({ format: 'email' }) }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          resetToken: Type.Optional(Type.String()),
          expiresIn: Type.Optional(Type.String())
        })
      }
    }
  }, async (req, reply) => {
    const token = await requestReset(req.body.email, fastify)

    if (!token) {
      return reply.send({ success: false })
    }

    reply.send({
      success: true,
      resetToken: token,
      expiresIn: '30m'
    })
  })

  /* ---------- RESET PASSWORD ---------- */
  fastify.post('/auth/reset', {
    schema: {
      tags: ['Auth'],
      summary: 'Aplica nueva contraseña usando token',
      body: Type.Object({
        token: Type.String(),
        newPassword: Type.String({ minLength: 8 })
      }),
      response: { 200: Type.Object({ success: Type.Boolean() }) }
    }
  }, async (req, reply) => {
    const ok = await resetPassword(req.body.token, req.body.newPassword, fastify)
    if (!ok) return reply.error?.(400, 'Token inválido o expirado')      // usa tu helper
    reply.send({ success: true })
  })
}
