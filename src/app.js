import Fastify from 'fastify';
import config from './config/config.js';
import homeRoutes from './routes/homeRoutes.js';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import staticFiles from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from '@fastify/cors';
/**
 * Rutas de ADMIN
 */
import roleRoutes from './routes/roleRoutes.js';

/**
 * Configuración para usar __dirname con ES modules.
 * Convierte la URL del archivo en una ruta de archivo y obtiene el directorio.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Inicializa una instancia de Fastify con opciones de configuración.
 * @type {FastifyInstance}
 */
const fastify = Fastify({ logger: true });

// Obtenemos las configuraciones desde el config.js
const { port, host, docsPath } = config;

/**
 * Se permiten todos los origenes en el CORS
 */
await fastify.register(cors, {
  origin: '*', // Permite todos los orígenes. Cámbialo por un dominio específico en producción.
});

/**
 * Configuración de OpenAPI 3.0 (antes Swagger).
 * Define la información básica de la API y las especificaciones.
 */
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'seguridad-services-ds611b',
      description: 'API Documentation',
      version: '1.0.0'
    },
    externalDocs: {
      url: 'https://swagger.io',
      description: 'Encuentra más información aquí'
    },
    components: {}
  }
});

/**
 * Definiciones de esquemas con ejemplos para la documentación y serialización.
 */
fastify.addSchema({
  $id: 'Roles',
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    nombre: { type: 'string', example: 'Admin' },
    descripcion: { type: 'string', example: 'Administrador del sistema' }
  }
});

fastify.addSchema({
  $id: 'ErrorResponse',
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'ERR_ROLE_NOT_FOUND' },
        message: { type: 'string', example: 'Rol no encontrado' },
        details: { type: 'string', example: null }
      }
    }
  }
});

fastify.addSchema({
  $id: 'Usuario',
  type: 'object',
  properties: {
    nombre: { type: 'string', maxLength: 100, example: 'Juan' },
    apellido: { type: 'string', maxLength: 100, example: 'Pérez' },
    email: { type: 'string', maxLength: 150, format: 'email', example: 'juan.perez@example.com' },
    password_hash: { type: 'string', maxLength: 255, example: '$2b$10$EIXaN/Z8g1234567890abcdefg' },
    telefono: { type: 'string', maxLength: 20, nullable: true, example: '+5491123456789' },
    rol_id: { type: 'integer', example: 2 }
  },
  required: ['nombre', 'apellido', 'email', 'password_hash', 'rol_id']
});


/**
 * Esquemas de validación sin ejemplos
 * Estos esquemas se utilizarán para la validación en lugar de para la documentación
 */
fastify.addSchema({
  $id: 'RoleValidation',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nombre: { type: 'string' },
    descripcion: { type: 'string' }
  }
});

fastify.addSchema({
  $id: 'ErrorResponseValidation',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'string' }
      }
    }
  }
});

fastify.addSchema({
  $id: 'UsuarioValidation',
  allOf: [
    { $ref: 'Usuario' },
    {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        created_at: { type: 'string', format: 'date-time', example: '2025-04-21T14:30:00Z' },
        updated_at: { type: 'string', format: 'date-time', example: '2025-04-21T15:00:00Z' }
      }
    }
  ]
});

/**
 * Configuración de Swagger UI (interfaz).
 * Define la ruta donde estará disponible la documentación y opciones de la interfaz.
 */
await fastify.register(swaggerUI, {
  routePrefix: `/${docsPath}`,
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true // Permite compartir enlaces directos a endpoints
  },
  staticCSP: true, // Mantiene seguridad básica
  transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
  transformSpecificationClone: true
});

/**
 * Configuración para servir archivos estáticos.
 * Define el directorio raíz y el prefijo para acceder a los archivos públicos.
 */
await fastify.register(staticFiles, {
  root: path.join(__dirname, '../public'),
  prefix: '/public/'
});

/**
 * Registra las rutas de la API.
 * Todas las rutas definidas en homeRoutes estarán bajo el prefijo '/api'.
 */
fastify.register(homeRoutes, { prefix: '/api' });
fastify.register(roleRoutes, { prefix: '/api' });

/**
 * Registra la landing page de la API
 */
fastify.get('/', {
  schema: {
    hide: true
  }
}, (request, reply) => {
  reply.sendFile('index.html', { root: path.join(__dirname, '../public') });
});

/**
 * Función asíncrona para iniciar el servidor.
 * Intenta escuchar en el puerto y host definidos y maneja errores en caso de fallo.
 */
const start = async () => {
  try {
    await fastify.listen({
      port: port,
      host: host
    });
    fastify.log.info(`Servidor ejecutandose en http://${host}:${port}`);
    fastify.log.info(`Documentacion disponible en http://${host}:${port}/${docsPath}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();