<div align="center">

<img src="frontend/img/redi.png" alt="CiudadActiva" width="120" />

# CiudadActiva

### Plataforma de gestión de problemas urbanos y participación ciudadana

Aplicación web full-stack para reportar incidencias urbanas, dar seguimiento a su estado, gestionar usuarios y permitir a autoridades y administradores supervisar la actividad del sistema.

<br>

![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000)
![Render](https://img.shields.io/badge/Render-Deploy-46E3B7?style=for-the-badge&logo=render&logoColor=000)

</div>

---

## Descripción

**CiudadActiva** es una plataforma pensada para mejorar la comunicación entre ciudadanía y autoridades.

Permite que los usuarios registren problemas urbanos como baches, fallas eléctricas, basura, alumbrado o incidencias de infraestructura, añadiendo descripción, categoría, ubicación e imagen.  
A partir de ahí, las autoridades pueden revisar los reportes, cambiar su estado, responderlos y gestionar su seguimiento.

Además, el sistema incorpora perfiles de usuario, notificaciones, historial personal, panel de autoridad, control de roles y un sistema de logs administrativos para auditar acciones importantes dentro de la plataforma.

---

## Características principales

### Módulo ciudadano
- Registro e inicio de sesión
- Creación de reportes urbanos
- Subida de imágenes en reportes
- Edición y eliminación de reportes propios
- Perfil de usuario con:
  - nombre
  - apellido
  - correo
  - teléfono
  - foto de perfil
- Historial personal de reportes
- Visualización de respuestas de autoridades
- Notificaciones del sistema

### Módulo de autoridad
- Panel administrativo para gestión de reportes
- Cambio de estado de incidencias
- Respuesta a reportes ciudadanos
- Dashboard con métricas del sistema
- Visualización centralizada de reportes

### Módulo de administración
- Gestión de roles de usuarios
- Eliminación de cuentas
- Visualización de logs del sistema
- Control de accesos administrativos

### Seguridad y control
- Contraseñas protegidas con `bcrypt`
- Roles:
  - `ciudadano`
  - `autoridad`
  - `admin`
- Restricción de acceso por rol
- Auditoría de eventos mediante logs

---

## Tecnologías utilizadas

### Backend
- **Node.js**
- **Express**
- **PostgreSQL**
- **pg**
- **bcrypt**
- **multer**
- **cors**
- **dotenv**

### Frontend
- **HTML5**
- **CSS3**
- **JavaScript Vanilla**

### Base de datos
- **PostgreSQL**

### Despliegue
- **Render**

---

## Estructura del proyecto

```bash
Proyecto/
│
├── backend/
│   └── src/
│       ├── db.js
│       └── server.js
│
├── frontend/
│   ├── css/
│   │   ├── style.css
│   │   ├── foro.css
│   │   └── authority.css
│   │
│   ├── js/
│   │   ├── main.js
│   │   ├── login.js
│   │   ├── registro.js
│   │   ├── foro.js
│   │   ├── perfil.js
│   │   ├── authority-common.js
│   │   ├── dashboard-roles.js
│   │   ├── dashboard-logs.js
│   │   └── theme.js
│   │
│   ├── img/
│   ├── uploads/
│   ├── index.html
│   ├── login.html
│   ├── registro.html
│   ├── foro.html
│   ├── perfil.html
│   ├── dashboard-autoridad.html
│   ├── dashboard-reportes.html
│   ├── dashboard-roles.html
│   └── dashboard-logs.html
│
├── db.sql
├── package.json
└── README.md
