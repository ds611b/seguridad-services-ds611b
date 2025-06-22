/**
 * Controlador para la ruta de inicio (home).
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply 
 * @returns {Promise<Object>} 
 */
const home = async (request, reply) => {
  return { message: '¡Hola Mundo Fastify!' };
};

/**
 * Controlador para la ruta de saludo personalizado.
 *
 * @param {import('fastify').FastifyRequest} request 
 * @param {import('fastify').FastifyReply} reply 
 * @returns {Promise<Object>} 
 */
const saludo = async (request, reply) => {
  return {
    message: 'Bienvenido a mi API escalable con arquitectura limpia',
  };
};

export default { home, saludo };
