# Manual de Desarrollador - Worldbuilding Lab Backend

## Índice

1. [Descripción General](#1-descripción-general)
2. [Requisitos Previos](#2-requisitos-previos)
3. [Configuración del Proyecto](#3-configuración-del-proyecto)
4. [Levantar el Proyecto](#4-levantar-el-proyecto)
5. [Comandos Útiles](#5-comandos-útiles)
6. [Estructura del Proyecto](#6-estructura-del-proyecto)
7. [Módulos Principales](#7-módulos-principales)
8. [Arquitectura de Soluciones y Workers](#8-arquitectura-de-soluciones-y-workers)
9. [Base de Datos](#9-base-de-datos)
10. [Sistema de Roles](#10-sistema-de-roles)
11. [Manejo de Errores](#11-manejo-de-errores)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Descripción General

**Austral Worldbuilding Lab** es una plataforma de worldbuilding colaborativo en tiempo real. El backend es una API REST construida con NestJS que gestiona:

- **Organizaciones** y **Proyectos** de worldbuilding
- **Mandalas**: representaciones visuales de personajes/contextos 
- **Generación de contenido con IA** (Gemini)
- **Colaboración**: invitaciones y roles por proyecto/organización

### Stack Principal

| Tecnología | Uso |
|------------|-----|
| NestJS 11 | Framework backend |
| PostgreSQL | Base de datos principal |
| Prisma | ORM |
| Redis | Cache y colas (BullMQ) |
| Firebase | Autenticación y Firestore |
| Azure Blob Storage | Archivos |
| Google Gemini | IA generativa |

---

## 2. Requisitos Previos

Antes de empezar, asegurate de tener instalado:

- **Node.js** v22 o superior
- **npm** (viene con Node)
- **Docker** y **Docker Compose**
- **Git**

Verificar instalación:
```bash
node --version    # v22.x.x
npm --version     # 10.x.x
docker --version  # Docker version 24.x.x o superior
```

---

## 3. Configuración del Proyecto

### 3.1 Clonar el repositorio

```bash
git clone https://github.com/austral-worldbuilding-lab/back.git
cd back
```

### 3.2 Instalar dependencias

```bash
npm install
```

Esto también configura Husky para los git hooks automáticamente.

### 3.3 Configurar variables de entorno

Crear archivo `.env` en la root del proyecto. Esto lo podemos hacer copiando el .env.example y poniendo los valores de las variables.

```bash
cp .env.example .env
```

**Variables requeridas:**

```bash
# Base de datos
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Firebase (pedir credenciales al equipo)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Azure Storage (pedir credenciales al equipo)
AZURE_STORAGE_ACCOUNT_NAME=
AZURE_STORAGE_CONTAINER_NAME=
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=

# Google AI
GOOGLE_AI_API_KEY=

# Aplicación
PORT=3000
NODE_ENV=development
```

**Variables opcionales:**

```bash
# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_LIMIT=250
THROTTLER_ENABLED=true

# Cache
CACHE_TTL=7200000
CACHE_MAX_ITEMS=500

# Workers (BullMQ)
ENABLE_WORKERS=true
WORKER_IDLE_TIMEOUT_MS=60000

# Email (para envío de invitaciones)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=

# Frontend URL (para links en emails)
FRONTEND_URL=http://localhost:5173
```

---

## 4. Levantar el Proyecto

### 4.1 Ambiente de desarrollo

**Paso 1: Levantar servicios con Docker**

```bash
docker-compose up -d
```

Esto levanta:
- El servidor en puerto `3000`
- PostgreSQL en puerto `5432`
- Redis en puerto `6379`
- Redis UI en puerto `5540`

**Paso 2: Ejecutar migraciones**

```bash
npx prisma generate
npx prisma migrate dev
```

**Paso 3: Ejecutar seed (primera vez)**

```bash
npm run prisma:seed
```

Esto crea los roles por defecto (dueño, facilitador, worldbuilder, lector).

**Paso 4: Iniciar el servidor**

Si queremos iniciar el servidor corriendo directamente el node (sin usar docker), pero ya executamos el `docker compose up`, se puede hacer:

```bash
docker stop awbl-app  # Solo si ya se hice el docker compose up
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000`.

La documentación Swagger está en `http://localhost:3000/api/docs`.

### 4.2 Solo levantar (si ya está configurado)

```bash
docker-compose up -d      # DB y Redis
npm run start:dev         # Backend
```

### 4.3 Ambiente de producción

```bash
npm run build
npm run start             # Incluye migraciones automáticas
```

---

## 5. Comandos Útiles

### Desarrollo
```bash
npm run start:dev          # Servidor en modo watch
npm run start:debug        # Servidor con debugger
```

### Base de datos
```bash
npx prisma studio          # UI para ver/editar datos
npx prisma migrate dev     # Crear/aplicar migraciones en dev
npx prisma migrate deploy  # Aplicar migraciones en prod
npx prisma generate        # Regenerar cliente Prisma
npm run prisma:seed        # Ejecutar seed
```

### Testing
```bash
npm run test               # Tests unitarios
npm run test:watch         # Tests en modo watch
npm run test:cov           # Tests con cobertura
npm run test:e2e           # Tests end-to-end
```

### Código
```bash
npm run lint               # Lint + fix
npm run lint:check         # Solo verificar lint
npm run format             # Formatear con Prettier
```

### Build
```bash
npm run build              # Compilar a dist/
```

### Git (saltear hooks si es necesario)
```bash
git push --no-verify       # Push sin pre-push hook
git commit --no-verify     # Commit sin pre-commit hook
```

---

## 6. Estructura del Proyecto

```
back/
├── src/
│   ├── main.ts                 # Entry point
│   ├── app.module.ts           # Módulo principal
│   ├── common/                 # Código compartido
│   │   ├── exceptions/         # Excepciones custom
│   │   ├── guards/             # Guards de autorización
│   │   ├── pipes/              # Validación
│   │   └── services/           # Logger, Cache
│   ├── config/                 # Configuraciones
│   └── modules/                # Módulos de negocio
│       ├── ai/                 # Generación con IA
│       ├── auth/               # Autenticación Firebase
│       ├── files/              # Gestión de archivos
│       ├── mandala/            # Mandalas
│       ├── organization/       # Organizaciones
│       ├── project/            # Proyectos
│       ├── queue/              # Procesamiento async para enciclopedia y soluciones
│       ├── solution/           # Soluciones
│       └── user/               # Usuarios
├── prisma/
│   ├── schema.prisma           # Esquema de DB
│   ├── migrations/             # Migraciones
│   └── seed.ts                 # Datos iniciales
├── docs/                       # Documentación
├── test/                       # Tests e2e
└── docker-compose.yml          # Servicios locales
```

---

## 7. Módulos Principales

### `auth/`
Autenticación con Firebase. Verifica tokens JWT en cada request.

### `organization/`
Gestiona organizaciones. Una organización agrupa proyectos y usuarios.

### `project/`
Gestiona proyectos de worldbuilding (También llamados mundos). Incluye configuración de dimensiones, escalas, tags, y jerarquía de proyectos (timeline).

### `mandala/`
Gestiona mandalas. Tipos: CHARACTER, CONTEXT, OVERLAP, OVERLAP_SUMMARY.

### `ai/`
Integración con Google Gemini. Se usa el `Strategy Pattern` para poder implementar otras integraciones con AIs. Genera: postits, preguntas, enciclopedias, soluciones, provocaciones, imágenes.

### `queue/`
Procesamiento asíncrono con BullMQ. Usa workers "on-demand" que se apagan cuando no hay trabajo (ahorra requests a Redis).

### `files/`
Upload y gestión de archivos en Azure Blob Storage.

### `solution/`
Gestiona soluciones generadas por IA. Incluye la posibilidad de generaraction items e imágenes concretas de la solución.

### `invitation/` y `organization-invitation/`
Sistema de invitaciones para agregar usuarios a proyectos/organizaciones.

---

## 8. Arquitectura de Soluciones y Workers

La funcionalidad de generación de soluciones utiliza el contenido de la enciclopedia del proyecto para plantear soluciones, sobre las cuales luego se pueden generar action items e imagenes concretas de esa solución. Dado que este proceso implica mayor complejidad y tiempo de respuesta, se diseñó una arquitectura asíncrona robusta.

### Flujo de Trabajo
1. **Request & Queue**: Cuando el usuario solicita soluciones, el trabajo no se procesa al instante, sino que se encola en **BullMQ**.
2. **Context Awareness**: El sistema verifica la existencia de una enciclopedia actualizada. Si no existe, se genera primero como paso previo.
3. **AI Generation**: Se utiliza Gemini para "razonar" sobre los problemas del proyecto y plantear soluciones concretas.

### Uso Estratégico de Redis
Esta es la **única parte del sistema que utiliza Redis** intensivamente, y la decisión de arquitectura responde a necesidades específicas:
- **Robustez y Pipeline**: Permite soportar una pipeline de trabajos (Soluciones -> Enciclopedia -> IA). Si un paso falla (ej. timeout de la API de IA), el sistema tiene un mecanismo de **fallback y retry automático** (backoff exponencial).
- **Escalabilidad**: Prepara al sistema para soportar múltiples requests de generación simultáneos en el futuro sin bloquear el thread principal de Node.js.
- **Gestión de Latencia**: Como generar soluciones tarda mucho tiempo, desacoplar el proceso en workers evita problemas de timeout en el frontend.

### Diagramas de Flujo

#### Generación de Enciclopedia
Este es el flujo base. La enciclopedia actúa como una capa de síntesis que resume todo el contenido del proyecto para proveer contexto a la IA. Está pensada específicamente para resaltar el **Contexto del Mundo**, **Personajes y Perspectivas**, **Dimensiones y Escalas**, **Patrones y Tendencias**, e **Insights y Oportunidades**. Esto optimiza su posterior uso para la generación de soluciones al eliminar ruido innecesario y enfocar al modelo en lo que realmente importa.

```mermaid
sequenceDiagram
    participant User as Cliente
    participant Q as Queue
    participant W as Worker
    participant AI as Google Gemini
    participant FS as Firestore
    participant AZ as Azure Blob Storage

    User->>Q: POST /project/:projectId/encyclopedia/generate
    Note right of User: Job Enqueued (Worker Notified)

    Note over Q,W: El Worker se despierta si estaba inactivo
    Q->>W: Process Job
    par Fetch Data
        W->>FS: Fetch Mandala Summaries
        W->>AZ: Fetch Multimedia Files
    end

    loop For each Mandala without Summary
        W->>AI: Generate Mandala Summary
        AI-->>W: Summary Content
        W->>FS: Save Summary
    end

    W->>AI: Generar Enciclopedia (usa Summaries)
    AI-->>W: Content
    
    W->>AZ: Save Encyclopedia File
    W->>Q: Job Completed
    
    User->>AZ: Get Encyclopedia File
```

#### Generación de Soluciones (con Dependencia)
La generación de soluciones es más compleja porque **depende** de que exista una enciclopedia. Si no existe, el worker de soluciones puede disparar un job de enciclopedia y esperar a que termine.

```mermaid
sequenceDiagram
    participant User as Cliente
    participant Q_SOL as Queue (Solutions)
    participant W_SOL as Worker (Solutions)
    participant Q_ENC as Queue (Encyclopedia)
    participant W_ENC as Worker (Encyclopedia)
    participant AI as Google Gemini
    participant DB as Base de Datos

    User->>Q_SOL: POST /project/:projectId/solutions/generate
    Note right of User: Job Enqueued (Worker Notified)
    
    Note over Q_SOL,W_SOL: El Worker se despierta si estaba inactivo
    Q_SOL->>W_SOL: Process Solution Job
    W_SOL->>W_SOL: Check Encyclopedia?
    
    alt Enciclopedia no existe
        W_SOL->>Q_ENC: Add Job (Encyclopedia)
        Q_ENC->>W_ENC: Process Encyclopedia Job
        W_ENC->>AI: Generate Content
        AI-->>W_ENC: Return Content
        W_ENC->>Q_ENC: Job Completed
        Note over W_SOL: Espera pasiva (waitUntilFinished)
        Q_ENC-->>W_SOL: Job Finalizado
    end

    W_SOL->>AI: Generate Solutions (usa Enciclopedia)
    AI-->>W_SOL: Solutions List
    W_SOL->>DB: Save Generated Solutions
    W_SOL->>Q_SOL: Job Completed
```

### Componentes de Queue
El sistema utiliza dos colas principales gestionadas por servicios específicos que extienden la lógica de "On-Demand":
- `SolutionsQueueService` (`src/modules/queue/services/solutions-queue.service.ts`)
- `EncyclopediaQueueService` (`src/modules/queue/services/encyclopedia-queue.service.ts`)

Ambos servicios registran sus propios procesadores y gestionan el ciclo de vida de los workers para que solo consuman recursos cuando hay trabajos activos.



### Workers On-Demand
Para optimizar el uso de recursos y minimizar costos (especialmente requests a servicios gestionados de Redis como Upstash):
- **On-Demand**: Los workers **no están encendidos 24/7**. Se inician automáticamente solo cuando se detectan trabajos en la cola y se apagan automáticamente cuando quedan inactivos.
- **Configuración Flexible**: Aunque ahora funcionan bajo demanda, el sistema está preparado para cambiar a un modelo "always-on" con un **cambio de configuración menor**.

---

## 9. Base de Datos

### Entidades principales

- **User**: usuarios del sistema
- **Organization**: agrupa proyectos
- **Project**: proyecto de worldbuilding (tiene configuración, dimensiones, escalas)
- **Mandala**: representación visual dentro de un proyecto
- **Role**: roles de permisos (dueño, facilitador, worldbuilder, lector)
- **UserProjectRole**: relación usuario-proyecto-rol
- **UserOrganizationRole**: relación usuario-organización-rol
- **Invitation**: invitaciones pendientes
- **Solution**: soluciones generadas
- **Provocation**: preguntas provocadoras

### Diagrama

Ver el schema completo en `prisma/schema.prisma`.

---

## 10. Sistema de Roles

Los roles se usan tanto a nivel de **organización** como de **proyecto**.

| Rol | Nivel | ¿Qué puede hacer? |
|-----|-------|-------------------|
| `dueño` | 1 | Todo: crear, editar, eliminar proyectos, gestionar usuarios |
| `facilitador` | 2 | Crear proyectos, gestionar usuarios, generar contenido con IA |
| `worldbuilder` | 3 | Crear contenido (tags, provocaciones), generar con IA, subir archivos |
| `lector` | 4 | Solo ver contenido |

> El nivel menor = más privilegios.

Los endpoints usan guards que verifican el rol:
```typescript
@RequireProjectRoles('dueño', 'facilitador')  // Solo estos roles pueden acceder
```

---

## 11. Manejo de Errores

El proyecto usa excepciones personalizadas. Importar desde `@common/exceptions/custom-exceptions`:

| Excepción | Código | Cuándo usar |
|-----------|--------|-------------|
| `ResourceNotFoundException` | 404 | Recurso no encontrado |
| `BusinessLogicException` | 422 | Regla de negocio violada |
| `ExternalServiceException` | 502 | Error en Firebase/Azure/Gemini |
| `StateConflictException` | 409 | Estado inválido para la operación |
| `ValidationException` | 400 | Error de validación |
| `ForbiddenException` | 403 | Sin permisos |

Ejemplo:
```typescript
if (!project) {
  throw new ResourceNotFoundException('Project', projectId);
}
```

---

## 12. Troubleshooting

### El servidor no conecta a la base de datos
- Verificar que Docker esté corriendo: `docker ps`
- Verificar `DATABASE_URL` en `.env`
- Reiniciar contenedor: `docker-compose down && docker-compose up -d`

### Error "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Las migraciones fallan
```bash
# Resetear DB (SOLO en desarrollo)
npx prisma migrate reset
```
Si hay problemas en producción, por migraciones que no sepan manejar casos cuando ya hay datos en la base de datos, hay que manejarlos manualmente.

### Redis no conecta
- Verificar que el contenedor está corriendo: `docker ps | grep redis`
- Verificar `REDIS_HOST` y `REDIS_PORT` en `.env`

### Error de Firebase (token inválido)
- Verificar que las credenciales de Firebase estén correctas en `.env`
- El `FIREBASE_PRIVATE_KEY` debe incluir los `\n` correctamente

### Los workers no procesan jobs
- Verificar `ENABLE_WORKERS=true` en `.env`
- Ver logs del servidor para errores de conexión a Redis

---

## Referencias

- [Documentación NestJS](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [BullMQ](https://docs.bullmq.io/)

---

*Última actualización: Diciembre 2025*
