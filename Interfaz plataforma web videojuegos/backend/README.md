# Backend TDV (API Express + MySQL)

```
backend/
├─ server.js            Arranca la app y conecta las rutas
├─ config/
│   ├─ env.js           Carga .env y valida secretos (JWT)
│   ├─ db.js            Conexión a MySQL
│   └─ paths.js         Ruta de la carpeta backend/
├─ middleware/
│   ├─ auth.js          Sesión de usuario y de admin (cookie o token Bearer)
│   ├─ rateLimits.js    Límite de intentos (login, reenvío, API)
│   └─ upload.js        Subida y validación de imágenes
├─ routes/              Un archivo por tema (todas cuelgan de /api)
│   ├─ games.js  platforms.js  sagas.js  tierlist.js
│   ├─ auth.js  user.js  votes.js  quiz.js
│   ├─ shop.js          Catálogo, direcciones y pedidos
│   └─ admin/           Rutas del administrador
├─ services/orders.js   Lógica de pedidos reutilizable
├─ utils/               email, validaciones, auditoría, notificaciones
└─ scripts/             create-user.js, igdb-import.js
```

Arranque: `npm install` y luego `node server.js`.
Comprobar: http://localhost:3001/api/health
