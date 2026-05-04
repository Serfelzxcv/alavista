
 


## Configuración del Proyecto

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Serfelzxcv/alavista
cd alavista

python -m venv venv   
 .\venv\Scripts\Activate              
                   
pip install -r requirements.txt
```

### 2. Configuración de la Base de Datos

1. Instala PostgreSQL en tu sistema.
2. Crea una base de datos llamada `alavista_db` 
3. Crea un usuario con permisos (por defecto: usuario `postgres`, contraseña `root`).

### 3. Configuración del Backend

 Navega al directorio del backend:

   ```bash
   cd backend
   ```



4. Instala las dependencias:

   ```bash
   pip install -r requirements.txt
   ```

5. Configura las variables de entorno (opcional, usa los valores por defecto si no configuras):

   Crea un archivo `.env` en el directorio `backend/` con:

   ```
   DJANGO_SECRET_KEY=tu-clave-secreta-aqui
   DJANGO_DEBUG=True
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
   DB_NAME=alavista_db
   DB_USER=postgres
   DB_PASSWORD=root
   DB_HOST=localhost
   DB_PORT=5432
   FRONTEND_URLS=http://localhost:5173,http://127.0.0.1:5173
   ```

6. Ejecuta las migraciones de la base de datos:

   ```bash
   python manage.py migrate
   ```

7. Crea un superusuario (opcional, para acceder al admin de Django):

   ```bash
   python manage.py createsuperuser
   ```

### 4. Configuración del Frontend

1. Navega al directorio del frontend:

   ```bash
   cd ../alavistafront
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

## Ejecutar el Proyecto

### Backend

1. Asegúrate de estar en el directorio `backend` con el entorno virtual activado.
2. Ejecuta el servidor de desarrollo:

   ```bash
   python manage.py runserver
   ```

   El backend estará disponible en `http://localhost:8000`.

### Frontend

1. Asegúrate de estar en el directorio `alavistafront`.
2. Ejecuta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   El frontend estará disponible en `http://localhost:5173`.

## Cargar Datos de Ejemplo

Para poblar la base de datos con datos de ejemplo (usuarios, proyectos y tareas), ejecuta el siguiente comando después de configurar el backend:

```bash
python manage.py load_sample_data
```

Esto creará:
- **4 usuarios** con diferentes roles (admin, project manager, developers)
- **2 proyectos** con estados diferentes (activo y archivado)
- **6 tareas** distribuidas entre los proyectos, con diferentes estados (todo, in_progress, in_review, done), prioridades (low, medium, high, critical) y asignaciones a diferentes usuarios

### Usuarios de Ejemplo

Después de ejecutar el comando, podrás iniciar sesión con estas credenciales:

- **Admin**: admin@example.com / admin123
- **Project Manager**: manager@example.com / manager123
- **Developer 1**: dev1@example.com / dev123
- **Developer 2**: dev2@example.com / dev123

**Nota**: El comando `load_sample_data` es un comando de gestión personalizado creado para este proyecto.

## Documentación de la API

La API está documentada con Swagger. Una vez que el backend esté ejecutándose, puedes acceder a la documentación en:

- Swagger UI: `http://localhost:8000/api/schema/swagger-ui/`
- ReDoc: `http://localhost:8000/api/schema/redoc/`

## Estructura del Proyecto

```
alavista/
├── README.md
├── alavistafront/          # Frontend React/TypeScript
│   ├── src/
│   ├── package.json
│   └── ...
└── backend/                # Backend Django
    ├── alavistabackend/
    ├── apps/
    │   ├── users/
    │   ├── projects/
    │   ├── tasks/
    │   └── comments/
    ├── manage.py
    └── requirements.txt
```

## Scripts Disponibles

### Backend

- `python manage.py runserver` - Inicia el servidor de desarrollo
- `python manage.py migrate` - Ejecuta migraciones de base de datos
- `python manage.py makemigrations` - Crea nuevas migraciones
- `python manage.py createsuperuser` - Crea un superusuario
- `python manage.py load_sample_data` - Carga datos de ejemplo en la base de datos
- `python manage.py test` - Ejecuta los tests

### Frontend

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run lint` - Ejecuta ESLint
- `npm run preview` - Vista previa de la build de producción

## Soporte

Si tienes problemas o preguntas, por favor abre un issue en el repositorio.