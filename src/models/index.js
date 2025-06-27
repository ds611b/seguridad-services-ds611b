// models/index.js
import Roles from './Roles.js';
import Usuarios from './Usuarios.js';
import PerfilUsuario from './PerfilUsuario.js';
import Instituciones from './Instituciones.js';
import ProyectosInstitucion from './ProyectosInstitucion.js';
import AplicacionesEstudiantes from './AplicacionesEstudiantes.js';
import Habilidades from './Habilidades.js';
import UsuariosHabilidades from './UsuariosHabilidades.js';
import ProyectosInstitucionesHabilidades from './ProyectosInstitucionesHabilidades.js';
import UsuariosSesiones from './UsuariosSesiones.js';
import Sesiones from './Sesiones.js';

// Definir relaciones

// Roles y Usuarios (1:N)
Roles.hasMany(Usuarios, { foreignKey: 'rol_id', onDelete: 'RESTRICT' });
Usuarios.belongsTo(Roles, { foreignKey: 'rol_id', as: 'rol', onDelete: 'RESTRICT' });

// Usuarios y PerfilUsuario (1:1)
Usuarios.hasOne(PerfilUsuario, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });
PerfilUsuario.belongsTo(Usuarios, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });

// Instituciones y ProyectosInstitucion (1:N)
Instituciones.hasMany(ProyectosInstitucion, { foreignKey: 'institucion_id', onDelete: 'CASCADE' });
ProyectosInstitucion.belongsTo(Instituciones, { foreignKey: 'institucion_id', as: 'institucion', onDelete: 'CASCADE' });

// AplicacionesEstudiantes con Usuarios y ProyectosInstitucion (N:M indirecto)
AplicacionesEstudiantes.belongsTo(Usuarios, { foreignKey: 'estudiante_id', as: 'estudiante', onDelete: 'CASCADE' });
AplicacionesEstudiantes.belongsTo(ProyectosInstitucion, { foreignKey: 'proyecto_id', as: 'proyecto', onDelete: 'CASCADE' });
Usuarios.hasMany(AplicacionesEstudiantes, { foreignKey: 'estudiante_id', onDelete: 'CASCADE' });
ProyectosInstitucion.hasMany(AplicacionesEstudiantes, { foreignKey: 'proyecto_id', onDelete: 'CASCADE' });

// Usuarios y Habilidades (N:M)
Usuarios.belongsToMany(Habilidades, { through: UsuariosHabilidades, foreignKey: 'usuario_id', onDelete: 'CASCADE' });
Habilidades.belongsToMany(Usuarios, { through: UsuariosHabilidades, foreignKey: 'habilidad_id', onDelete: 'CASCADE' });

// ProyectosInstitucion y Habilidades (N:M)
ProyectosInstitucion.belongsToMany(Habilidades, { through: ProyectosInstitucionesHabilidades, foreignKey: 'proyecto_id', onDelete: 'CASCADE' });
Habilidades.belongsToMany(ProyectosInstitucion, { through: ProyectosInstitucionesHabilidades, foreignKey: 'habilidad_id', onDelete: 'CASCADE' });
ProyectosInstitucionesHabilidades.belongsTo(ProyectosInstitucion, { foreignKey: 'proyecto_id', as: 'proyecto'});
ProyectosInstitucionesHabilidades.belongsTo(Habilidades, { foreignKey: 'habilidad_id', as: 'habilidades', onDelete: 'CASCADE'});

// Usuarios y UsuariosSesiones
Usuarios.hasMany(UsuariosSesiones, { foreignKey: 'usuario_id', onDelete: 'CASCADE' })
UsuariosSesiones.belongsTo(Usuarios, { foreignKey: 'usuario_id', onDelete: 'CASCADE' })

Sesiones.hasMany(UsuariosSesiones, { foreignKey: 'sesion_id', onDelete: 'CASCADE' })
UsuariosSesiones.belongsTo(Sesiones, { foreignKey: 'sesion_id', onDelete: 'CASCADE' })


// Exportar todos los modelos
export {
  Roles,
  Usuarios,
  PerfilUsuario,
  Instituciones,
  ProyectosInstitucion,
  AplicacionesEstudiantes,
  Habilidades,
  UsuariosHabilidades,
  ProyectosInstitucionesHabilidades,
  UsuariosSesiones,
  Sesiones
};