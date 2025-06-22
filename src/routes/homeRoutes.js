import homeController from "../controllers/homeController.js";

/**
 * Define las rutas relacionadas con el controlador Home.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options 
 */
async function homeRoutes(fastify, options) {
  /**
   * Ruta principal ("/") que devuelve un mensaje de saludo.
   */
  fastify.get('/', {
    schema: {
      description: 'Endpoint de inicio',
      tags: ['Home'],
      response: {
        200: {
          description: 'Respuesta exitosa',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, homeController.home);

  /**
   * Ruta de saludo ("/saludo") que devuelve un mensaje de bienvenida.
   */
  fastify.get('/saludo', {
    schema: {
      description: 'Endpoint de saludo',
      tags: ['Home'],
      response: {
        200: {
          description: 'Respuesta exitosa',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, homeController.saludo);
}

export default homeRoutes;
