// src/plugins/jwt.js
import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'

export default fp(async (fastify, opts) => {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET,
    sign: { expiresIn: process.env.JWT_REFRESH_EXPIRES }
  })

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })
})
