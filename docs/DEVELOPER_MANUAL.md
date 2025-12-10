# 📖 Manual de Desarrollador - Worldbuilding Lab Backend

## Índice

1. [Descripción General](#1-descripción-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Proyecto](#3-arquitectura-del-proyecto)
4. [Estructura de Directorios](#4-estructura-de-directorios)
5. [Modelos de Datos](#5-modelos-de-datos)
6. [Módulos del Sistema](#6-módulos-del-sistema)
7. [Autenticación y Autorización](#7-autenticación-y-autorización)
8. [Integración con Servicios Externos](#8-integración-con-servicios-externos)
9. [Sistema de Colas (BullMQ)](#9-sistema-de-colas-bullmq)
10. [Manejo de Errores](#10-manejo-de-errores)
11. [Convenciones de Código](#11-convenciones-de-código)
12. [Testing](#12-testing)
13. [Configuración y Variables de Entorno](#13-configuración-y-variables-de-entorno)
14. [Despliegue](#14-despliegue)
15. [Guías de Desarrollo](#15-guías-de-desarrollo)

---

## 1. Descripción General

**Worldbuilding Lab** (AWBL - Austral Worldbuilding Lab) es una plataforma de worldbuilding que permite a los usuarios crear y explorar mundos de manera colaborativa. El backend proporciona una API RESTful que gestiona:

- **Organizaciones**: Agrupaciones de usuarios y proyectos
- **Proyectos**: Espacios de trabajo para worldbuilding
- **Mandalas**: Representaciones visuales de personajes y conceptos con múltiples dimensiones
- **Generación de contenido con IA**: Postits, preguntas, soluciones, enciclopedias
- **Colaboración**: Sistema de invitaciones y roles por proyecto/organización

### Características Principales

- Autenticación con Firebase
- Integración con Google Gemini AI para generación de contenido
- Almacenamiento en Azure Blob Storage
- Procesamiento asíncrono con BullMQ y Redis
- Base de datos PostgreSQL con Prisma ORM
- Sincronización en tiempo real con Firestore
- Sistema de notificaciones y correo electrónico

---

## 2. Stack Tecnológico

### Core
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | 11.x | Framework principal |
| TypeScript | 5.8.x | Lenguaje de programación |
| Node.js | 22.x+ | Runtime |

### Base de Datos y ORM
| Tecnología | Propósito |
|------------|-----------|
| PostgreSQL | Base de datos principal |
| Prisma | ORM y migraciones |
| Redis | Cache y colas |

### Servicios Externos
| Servicio | Propósito |
|----------|-----------|
| Firebase Auth | Autenticación de usuarios |
| Firestore | Datos en tiempo real (documentos de mandalas) |
| Azure Blob Storage | Almacenamiento de archivos |
| Google Gemini AI | Generación de contenido con IA |

### Procesamiento Asíncrono
| Tecnología | Propósito |
|------------|-----------|
| BullMQ | Sistema de colas |
| Redis | Backend para BullMQ |

### Herramientas de Desarrollo
| Herramienta | Propósito |
|-------------|-----------|
| Jest | Testing |
| ESLint | Linting |
| Prettier | Formateo de código |
| Husky | Git hooks |
| Swagger | Documentación de API |

---

## 3. Arquitectura del Proyecto

### Arquitectura General

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Cliente (Frontend)                               │
└─────────────────────────────────────┬────────────────────────────────────────┘
                                      │ HTTP/REST
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            NestJS Backend                                    │
│                                                                              │
│  Request → [Pipes] → [Guards] → [Controller] → [Service] → [Repository]      │
│                                                     │                        │
│                                                     ▼                        │
│                                              [Adapters/Strategies]           │
│                                                     │                        │
│                                                                              │
└──────────┬─────────────────────┬─────────────────────┬───────────────────────┘
           │                     │                     │
           ▼                     ▼                     ▼
    ┌─────────────┐      ┌─────────────┐      ┌─────────────────────┐
    │ PostgreSQL  │      │    Redis    │      │ Servicios Externos  │
    │  (Prisma)   │      │ Cache/Queue │      │ • Firebase Auth     │
    │             │      │  (BullMQ)   │      │ • Firestore         │
    └─────────────┘      └──────┬──────┘      │ • Azure Blob        │
                                │             │ • Google Gemini     │
                                ▼             └─────────────────────┘
                         ┌─────────────┐
                         │  Workers    │
                         │ (On-Demand) │
                         └─────────────┘
```

### Flujo de una Request Típica

```
     Request HTTP
         │
         ▼
┌──────────────────┐
│ Global Pipes     │ ← ValidationPipe (transforma y valida DTOs)
│ (Validación)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Auth Guard       │ ← Verifica token de Firebase
│ (Firebase JWT)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Role Guards      │ ← Verifica permisos del usuario
│ (Project/Org)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Throttle Guard   │ ← Rate limiting por usuario
│ (Rate Limiting)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Controller       │ ← Maneja la request
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Service          │ ← Lógica de negocio
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Repository       │ ← Acceso a datos (Prisma)
└──────────────────┘
```

---

## 4. Estructura de Directorios

```
back/
├── src/
│   ├── main.ts                    # Punto de entrada de la aplicación
│   ├── app.module.ts              # Módulo principal
│   │
│   ├── common/                    # Código compartido entre módulos
│   │   ├── common.module.ts
│   │   ├── dto/                   # DTOs compartidos
│   │   │   └── dimension.dto.ts
│   │   ├── exceptions/            # Excepciones personalizadas
│   │   │   └── custom-exceptions.ts
│   │   ├── filters/               # Filtros de excepción
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/                # Guards compartidos
│   │   │   ├── base-organization-role.guard.ts
│   │   │   ├── base-project-role.guard.ts
│   │   │   ├── organization-owner.guard.ts
│   │   │   ├── owner.guard.ts
│   │   │   └── user-throttler.guard.ts
│   │   ├── pipes/                 # Pipes de validación
│   │   │   ├── enum-validation.pipe.ts
│   │   │   ├── firebase-uid-validation.pipe.ts
│   │   │   ├── image-file-validation.pipe.ts
│   │   │   └── uuid-validation.pipe.ts
│   │   ├── services/              # Servicios compartidos
│   │   │   ├── cache.service.ts
│   │   │   └── logger.service.ts
│   │   ├── types/                 # Tipos compartidos
│   │   │   ├── presigned-url.ts
│   │   │   └── responses.ts
│   │   └── utils/                 # Utilidades
│   │       ├── cache.utils.ts
│   │       └── color.utils.ts
│   │
│   ├── config/                    # Configuraciones
│   │   ├── ai-temperature.config.ts
│   │   ├── ai-validation.config.ts
│   │   ├── firebase.config.ts
│   │   ├── mail.config.ts
│   │   └── project-validation.config.ts
│   │
│   └── modules/                   # Módulos de funcionalidad
│       ├── ai/                    # Módulo de IA
│       ├── auth/                  # Autenticación
│       ├── consumption/           # Tracking de consumo de IA
│       ├── files/                 # Gestión de archivos
│       ├── firebase/              # Integración con Firebase
│       ├── health/                # Health checks
│       ├── invitation/            # Invitaciones a proyectos
│       ├── mail/                  # Envío de correos
│       ├── mandala/               # Mandalas
│       ├── notification/          # Notificaciones en tiempo real
│       ├── organization/          # Organizaciones
│       ├── organization-invitation/ # Invitaciones a organizaciones
│       ├── prisma/                # Servicio de Prisma
│       ├── project/               # Proyectos
│       ├── queue/                 # Sistema de colas (BullMQ)
│       ├── role/                  # Roles
│       ├── solution/              # Soluciones
│       ├── storage/               # Azure Blob Storage
│       ├── useful-resources/      # Recursos útiles
│       └── user/                  # Usuarios
│
├── prisma/
│   ├── schema.prisma              # Esquema de base de datos
│   ├── migrations/                # Migraciones
│   └── seed.ts                    # Seed de datos para roles default
│
├── docs/                          # Documentación técnica
|   ├── images/                    # Imagenes usadas en los documentos
│   ├── DEVELOPER_MANUAL.md
│   ├── ERROR_HANDLING_CHEATSHEET.md
│   ├── ON-DEMAND-WORKERS.md
│   ├── REDIS-BULLMQ-ANALISIS.md
│   ├── SOLUCION-REDIS-REQUESTS.md
│   └── SOLUTIONS_GENERATION.MD
│
├── test/                          # Tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── docker-compose.yml             # Configuración de Docker
├── Dockerfile                     # Imagen de Docker
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Estructura de un Módulo Típico

```
modules/project/
├── project.module.ts              # Definición del módulo
├── project.controller.ts          # Endpoints REST
├── project.service.ts             # Lógica de negocio
├── project.repository.ts          # Acceso a datos
├── dto/                           # Data Transfer Objects
│   ├── create-project.dto.ts
│   ├── update-project.dto.ts
│   └── project.dto.ts
├── guards/                        # Guards específicos
│   └── project-role.guard.ts
├── decorators/                    # Decoradores personalizados
│   └── project-swagger.decorators.ts
├── types/                         # Tipos TypeScript
│   └── project-configuration.type.ts
└── resources/                     # Recursos (si aplica)
    └── default-values.ts
```

---

## 5. Modelos de Datos

### Diagrama de Entidades

![Descripción del diagrama](docs/images/WBL Local Docker DB.svg)

### Entidades Principales

#### User
```prisma
model User {
  id                     String    @id @default(uuid())
  username               String    @unique
  email                  String    @unique
  fullName               String
  is_active              Boolean   @default(true)
  projectRoles           UserProjectRole[]
  organizationRoles      UserOrganizationRole[]
  Invitation             Invitation[]
  OrganizationInvitation OrganizationInvitation[]
  AiUsage                AiUsage[]
}
```

#### Organization
```prisma
model Organization {
  id        String    @id @default(uuid())
  name      String
  imageUrl  String?
  bannerUrl String?
  createdAt DateTime  @default(now())
  isActive  Boolean   @default(true)
  deletedAt DateTime?
  
  projects                Project[]
  userRoles               UserOrganizationRole[]
  organizationInvitations OrganizationInvitation[]
  AiUsage                 AiUsage[]
}
```

#### Project
```prisma
model Project {
  id            String    @id @default(uuid())
  name          String
  icon          String    @default("folder")
  iconColor     String    @default("#172187")
  description   String?
  configuration Json      // Contains dimensions[] and scales[]
  createdAt     DateTime  @default(now())
  isActive      Boolean   @default(true)
  deletedAt     DateTime?
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  organizationId  String
  
  // Jerarquía de proyectos (para timeline)
  parentProjectId String?
  parent          Project?  @relation("ProjParent", ...)
  children        Project[] @relation("ProjParent")
  rootProjectId   String?
  
  userRoles     UserProjectRole[]
  mandalas      Mandala[]
  Invitation    Invitation[]
  tags          Tag[]
  provocations  ProjProvLink[]
  solutions     ProjSolLink[]
}
```

#### Mandala
```prisma
model Mandala {
  id            String      @id @default(uuid())
  name          String
  type          MandalaType @default(CHARACTER)
  configuration Json        // Contains centerCharacter, dimensions[], scales[]
  project       Project     @relation(...)
  projectId     String
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  isActive      Boolean     @default(true)
  deletedAt     DateTime?
  
  // Relación padre-hijo entre mandalas
  children Mandala[] @relation("MandalaToMandala")
  parent   Mandala[] @relation("MandalaToMandala")
}

enum MandalaType {
  CHARACTER       // Mandala de personaje individual
  OVERLAP         // Superposición de mandalas
  OVERLAP_SUMMARY // Superposición con resumen de IA
  CONTEXT         // Mandala de contexto
}
```

#### Role (Sistema de Permisos)
```prisma
model Role {
  id       String @id @default(uuid())
  name     String @unique
  level    Int    @unique  // Menor número = mayor privilegio
  
  userRoles               UserProjectRole[]
  organizationRoles       UserOrganizationRole[]
  invitations             Invitation[]
  organizationInvitations OrganizationInvitation[]
}
```

#### Solution y Provocation
```prisma
model Solution {
  id                String       @id @default(uuid())
  title             String
  description       String
  problem           String
  impactLevel       ImpactLevel?
  impactDescription String?
  actionItems       Json?        // Array de action items
  
  projects     ProjSolLink[]
  provocations SolProvLink[]
}

model Provocation {
  id                    String  @id @default(uuid())
  parentProvocationId   String?
  question              String
  content               Json?   // title, description
  
  projects  ProjProvLink[]
  solutions SolProvLink[]
}
```

---

## 6. Módulos del Sistema

### 6.1 Módulo de AI (`ai/`)

El módulo de IA es uno de los más complejos del sistema. Utiliza el patrón **Strategy** para diferentes tipos de generación.

```
ai/
├── ai.module.ts           # Configuración del módulo
├── ai.controller.ts       # Endpoints de IA
├── ai.service.ts          # Servicio principal (fachada)
├── adapters/
│   └── gemini-adapter.ts  # Adaptador para Google Gemini
├── factories/
│   └── ai-provider.factory.ts  # Factory para providers de IA
├── interfaces/
│   └── ai-provider.interface.ts
├── strategies/            # Estrategias de generación
│   ├── postits.strategy.ts
│   ├── questions.strategy.ts
│   ├── encyclopedia.strategy.ts
│   ├── solutions.strategy.ts
│   ├── provocations.strategy.ts
│   ├── mandala-images.strategy.ts
│   └── ...
├── services/
│   ├── ai-prompt-builder.service.ts
│   ├── gemini-generation-engine.service.ts
│   ├── file-loader.service.ts
│   └── gemini-file-cache.service.ts
└── resources/
    └── prompts/           # Templates de prompts
        ├── prompt_generar_postits.txt
        ├── prompt_generar_preguntas.txt
        └── ...
```

**Servicios de IA disponibles:**
- `generatePostits()` - Genera post-its para mandalas
- `generateQuestions()` - Genera preguntas de exploración
- `generateEncyclopedia()` - Genera enciclopedia del proyecto
- `generateSolutions()` - Genera soluciones basadas en problemáticas
- `generateProvocations()` - Genera preguntas provocadoras
- `generateMandalaImages()` - Genera imágenes para mandalas
- `generateMandalaSummary()` - Genera resúmenes de mandalas

### 6.2 Módulo de Mandala (`mandala/`)

Gestiona las mandalas, que son representaciones visuales con dimensiones y escalas.

**Tipos de Mandala:**
- `CHARACTER`: Mandala centrada en un personaje/concepto
- `CONTEXT`: Mandala de contexto (futuro/presente)
- `OVERLAP`: Superposición de múltiples mandalas
- `OVERLAP_SUMMARY`: Superposición con análisis de IA

**Operaciones principales:**
- CRUD de mandalas
- Generación de mandalas con IA
- Vinculación padre-hijo entre mandalas
- Generación de filtros dinámicos
- Generación de resúmenes
- Upload de archivos de texto

### 6.3 Módulo de Project (`project/`)

Gestiona proyectos de worldbuilding y su configuración.

**Características:**
- Configuración de dimensiones y escalas
- Sistema de tags
- Jerarquía de proyectos (timeline)
- Generación de enciclopedia
- Gestión de provocaciones
- Generación de deliverables

### 6.4 Módulo de Queue (`queue/`)

Sistema de procesamiento asíncrono con BullMQ y workers on-demand.

```
queue/
├── queue.module.ts
├── queue.config.ts
├── processors/
│   ├── base/
│   │   └── on-demand.processor.ts  # Clase base abstracta
│   ├── encyclopedia.processor.ts
│   └── solutions.processor.ts
├── services/
│   ├── encyclopedia-queue.service.ts
│   └── solutions-queue.service.ts
└── types/
    ├── encyclopedia-job.types.ts
    └── solutions-job.types.ts
```

**Características del sistema on-demand:**
- Workers que se inician solo cuando hay jobs
- Auto-cierre después de 1 minuto de inactividad
- Notificación directa en lugar de polling
- ~99% reducción de requests a Redis cuando está idle

### 6.5 Módulo de Files (`files/`)

Gestiona archivos y almacenamiento.

**Servicios:**
- `FileService` - Gestión general de archivos
- `TextStorageService` - Almacenamiento de texto
- `VideoProcessingService` - Procesamiento de video (ffmpeg)
- `AzureBlobStorageService` - Integración con Azure

**Scopes de archivos:**
```typescript
interface FileScope {
  orgId: string;
  projectId?: string;
  mandalaId?: string;
}
```

### 6.6 Módulo de Solution (`solution/`)

Gestiona soluciones generadas por IA para problemas identificados.

**Flujo de generación:**
1. Usuario solicita generación de soluciones
2. Se encola job en BullMQ
3. Se genera/obtiene enciclopedia del proyecto
4. IA genera soluciones basadas en la enciclopedia
5. Soluciones se cachean en Redis
6. Usuario recupera soluciones del cache

---

## 7. Autenticación y Autorización

### 7.1 Autenticación con Firebase

```typescript
// El token JWT de Firebase se envía en el header Authorization
Authorization: Bearer <firebase-jwt-token>
```

**Flujo de autenticación:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────▶│   Backend   │────▶│  Firebase   │
│             │     │             │     │   Admin     │
│  1. Token   │     │ 2. Verify   │     │ 3. Validate │
│     JWT     │     │    Token    │     │    Token    │
└─────────────┘     └─────────────┘     └─────────────┘
                                                │
                                                ▼
                                        ┌─────────────┐
                                        │ 4. Attach   │
                                        │    User to  │
                                        │    Request  │
                                        └─────────────┘
```

**Estructura del usuario en request:**
```typescript
interface RequestWithUser extends Request {
  user: {
    id: string;       // UID del usuario en nuestra DB
    firebaseUid: string;
    email: string;
    // ... otros campos
  };
}
```

### 7.2 Sistema de Roles

El sistema tiene dos niveles de roles:

1. **Roles de Organización** (`UserOrganizationRole`)
2. **Roles de Proyecto** (`UserProjectRole`)

**Roles del sistema (definidos en `prisma/seed.ts`):**

| Rol | Nivel | Descripción |
|-----|-------|-------------|
| `dueño` | 1 | **Control total.** Puede crear/editar/eliminar proyectos, gestionar usuarios y roles, eliminar tags, y realizar todas las acciones del sistema. |
| `facilitador` | 2 | **Administrador de proyecto.** Puede crear proyectos y subproyectos, gestionar usuarios del proyecto, crear provocaciones, generar contenido con IA, pero no puede eliminar proyectos ni editar su configuración. |
| `worldbuilder` | 3 | **Colaborador activo.** Puede crear subproyectos, tags, provocaciones, generar enciclopedias y soluciones con IA, subir archivos. No puede gestionar usuarios ni eliminar recursos importantes. |
| `lector` | 4 | **Solo lectura.** Puede ver provocaciones, deliverables y contenido del proyecto. No puede crear ni editar nada. |

> **Nota:** El nivel menor indica mayor privilegio. Los guards verifican que el usuario tenga un rol incluido en la lista de roles permitidos para cada acción.

### 7.3 Guards de Autorización

```typescript
// Guard base para roles de proyecto
@Injectable()
export abstract class BaseProjectRoleGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Extraer userId y projectId del request
    // 2. Verificar que el usuario tiene rol en el proyecto
    // 3. Verificar que el rol es suficiente para la acción
  }
}

// Uso en controllers
@UseGuards(AuthGuard, ProjectRoleGuard)
@RequireProjectRoles('owner', 'admin')  // Solo owners y admins
@Post()
createSomething() { }
```

**Guards disponibles:**
- `AuthGuard` - Verifica autenticación Firebase
- `ProjectRoleGuard` - Verifica rol en proyecto
- `OrganizationRoleGuard` - Verifica rol en organización
- `OwnerGuard` - Verifica que es owner del proyecto
- `OrganizationOwnerGuard` - Verifica que es owner de la organización
- `UserThrottlerGuard` - Rate limiting por usuario

---

## 8. Integración con Servicios Externos

### 8.1 Firebase

**Servicios utilizados:**
- **Firebase Auth**: Autenticación de usuarios
- **Firestore**: Almacenamiento de documentos de mandalas en tiempo real

```typescript
// FirebaseDataService - Operaciones con Firestore
class FirebaseDataService {
  createDocument(projectId: string, data: any, docId: string): Promise<void>;
  getDocument(projectId: string, docId: string): Promise<FirestoreDocument>;
  updateDocument(projectId: string, data: any, docId: string): Promise<void>;
  deleteDocument(projectId: string, docId: string): Promise<void>;
}
```

**Estructura de documento en Firestore:**
```typescript
interface FirestoreMandalaDocument {
  mandala: MandalaDto;
  postits: PostitWithCoordinates[];
  characters: FirestoreCharacter[];
  summaryReport?: string;
}
```

### 8.2 Azure Blob Storage

```typescript
// AzureBlobStorageService
class AzureBlobStorageService {
  uploadBuffer(buffer: Buffer, fileName: string, scope: FileScope, folder: string, contentType: string): Promise<string>;
  uploadFile(file: Express.Multer.File, scope: FileScope): Promise<string>;
  getPresignedUrl(scope: FileScope, fileName: string): Promise<string>;
  deleteFile(scope: FileScope, fileName: string): Promise<void>;
  listFiles(scope: FileScope): Promise<string[]>;
}
```

**Estructura de paths en Azure:**
```
container/
├── org/{orgId}/
│   ├── project/{projectId}/
│   │   ├── mandala/{mandalaId}/
│   │   │   └── files/
│   │   ├── deliverables/
│   │   └── files/
│   └── files/
```

### 8.3 Google Gemini AI

```typescript
// GeminiAdapter - Implementación del AiProvider
class GeminiAdapter implements AiProvider {
  generatePostits(...): Promise<AiResponseWithUsage<AiPostitResponse[]>>;
  generateQuestions(...): Promise<AiResponseWithUsage<AiQuestionResponse[]>>;
  generateEncyclopedia(...): Promise<AiResponseWithUsage<AiEncyclopediaResponse>>;
  // ... otros métodos
}
```

**Configuración de temperaturas por servicio:**
```typescript
// ai-temperature.config.ts
export const AI_TEMPERATURE_CONFIG = {
  postits: 0.8,
  questions: 0.7,
  encyclopedia: 0.3,
  solutions: 0.5,
  // ...
};
```

---

## 9. Sistema de Colas (BullMQ)

### 9.1 Arquitectura On-Demand

El sistema utiliza workers que se inician/detienen automáticamente para optimizar el uso de Redis.

```
┌─────────────────────────────────────────────────────────────┐
│                    NestJS Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ Encyclopedia     │         │ Solutions        │          │
│  │ Processor        │         │ Processor        │          │
│  │                  │         │                  │          │
│  │ ┌────────────┐   │         │ ┌────────────┐   │          │
│  │ │  Worker    │   │         │ │  Worker    │   │          │
│  │ │(ON-DEMAND) │   │         │ │(ON-DEMAND) │   │          │
│  │ └────────────┘   │         │ └────────────┘   │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Flujo de Jobs

```typescript
// 1. Encolar un job
const jobId = await this.solutionsQueueService.addGenerateSolutionsJob(projectId, userId);

// 2. El QueueService notifica al processor
this.notifyJobAdded();

// 3. El processor inicia el worker si está cerrado
await this.ensureWorkerRunning();

// 4. El worker procesa el job
// 5. Resultados se guardan en cache Redis
// 6. Worker se cierra después de 1 minuto idle
```

### 9.3 Tipos de Jobs

**Encyclopedia Job:**
```typescript
interface EncyclopediaJobData {
  projectId: string;
  userId: string;
  organizationId: string;
}
```

**Solutions Job:**
```typescript
interface SolutionsJobData {
  projectId: string;
  userId: string;
  organizationId: string;
}
```

### 9.4 Configuración

```typescript
// queue.config.ts
export const QUEUE_CONFIG = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

// Timeout de idle del worker
WORKER_IDLE_TIMEOUT_MS=60000  // 1 minuto
```

---

## 10. Manejo de Errores

### 10.1 Excepciones Personalizadas

```typescript
// Importar excepciones
import {
  ResourceNotFoundException,      // 404 - Recurso no encontrado
  BusinessLogicException,         // 422 - Error de lógica de negocio
  ExternalServiceException,       // 502 - Error de servicio externo
  ValidationException,            // 400 - Error de validación
  AuthorizationException,         // 403 - Error de autorización
  StateConflictException,         // 409 - Conflicto de estado
  BadRequestException,            // 400 - Petición incorrecta
  UnauthorizedException,          // 401 - No autenticado
  ForbiddenException,             // 403 - Prohibido
  ConflictException,              // 409 - Conflicto
  InternalServerErrorException    // 500 - Error interno
} from '@common/exceptions/custom-exceptions';
```

### 10.2 Cuándo Usar Cada Excepción

| Situación | Excepción | Código |
|-----------|-----------|--------|
| Usuario/Proyecto/Recurso no existe | `ResourceNotFoundException` | 404 |
| Regla de negocio violada | `BusinessLogicException` | 422 |
| Firebase/API externa falla | `ExternalServiceException` | 502 |
| Estado inválido para operación | `StateConflictException` | 409 |
| Permisos insuficientes | `AuthorizationException` | 403 |
| Validación específica falla | `ValidationException` | 400 |
| Token inválido/faltante | `UnauthorizedException` | 401 |

### 10.3 Ejemplos de Uso

```typescript
// Recurso no encontrado
if (!user) {
  throw new ResourceNotFoundException('User', userId);
}

// Lógica de negocio
if (activeMandalas > 0) {
  throw new BusinessLogicException('Cannot delete project with active mandalas', {
    projectId, activeMandalaCount: activeMandalas
  });
}

// Servicio externo
try {
  return await firebase.verifyToken(token);
} catch (error) {
  throw new ExternalServiceException('Firebase Auth', 'Token verification failed', {
    errorCode: error.code
  });
}

// Conflicto de estado
if (invitation.status !== 'PENDING') {
  throw new StateConflictException(invitation.status, 'accept invitation', {
    validStates: ['PENDING']
  });
}
```

### 10.4 Filtro Global de Excepciones

El `HttpExceptionFilter` captura todas las excepciones y las formatea consistentemente:

```typescript
// Respuesta de error típica
{
  "statusCode": 404,
  "message": "User with identifier 'abc-123' not found",
  "error": "Resource Not Found",
  "resourceType": "User",
  "identifier": "abc-123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/users/abc-123"
}
```

---

## 11. Convenciones de Código

### 11.1 Nomenclatura

**Archivos:**
- Kebab-case: `user-project-role.guard.ts`
- Sufijos descriptivos: `.controller.ts`, `.service.ts`, `.repository.ts`, `.dto.ts`, `.guard.ts`

**Clases:**
- PascalCase: `UserProjectRoleGuard`
- Sufijos: `Controller`, `Service`, `Repository`, `Guard`, `Pipe`, `Filter`

**Variables y funciones:**
- camelCase: `getUserById`, `projectId`

**Constantes:**
- SCREAMING_SNAKE_CASE: `REQUIRED_PROJECT_ROLES_KEY`

### 11.2 Estructura de DTOs

```typescript
// create-*.dto.ts - Para crear recursos
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// update-*.dto.ts - Para actualizar (parcial)
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

// *.dto.ts - Para respuestas
export class ProjectDto {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}
```

### 11.3 Path Aliases

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@config/*": ["src/config/*"],
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"]
    }
  }
}
```

### 11.4 Logging

```typescript
// Usar AppLogger con contexto
@Injectable()
export class MyService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(MyService.name);
  }

  async doSomething() {
    this.logger.log('Starting operation');
    this.logger.debug('Debug info', { data });
    this.logger.warn('Warning message');
    this.logger.error('Error occurred', error.stack);
  }
}
```

---

## 12. Testing

### 12.1 Estructura de Tests

```
src/modules/project/
├── project.service.ts
├── project.service.spec.ts        # Tests unitarios
├── project-deletion.spec.ts       # Tests específicos
└── ...

test/
├── app.e2e-spec.ts                # Tests e2e
└── jest-e2e.json
```

### 12.2 Comandos de Testing

```bash
# Tests unitarios
npm run test

# Tests en modo watch
npm run test:watch

# Tests con cobertura
npm run test:cov

# Tests e2e
npm run test:e2e

# Tests de integración específicos
npm run test:firebase
```

### 12.3 Ejemplo de Test Unitario

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { PrismaService } from '@modules/prisma/prisma.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let prisma: PrismaService;

  const mockPrismaService = {
    project: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should find a project by id', async () => {
    const mockProject = { id: 'test-id', name: 'Test Project' };
    mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

    const result = await service.findOne('test-id');
    
    expect(result).toEqual(mockProject);
    expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-id' },
    });
  });
});
```

---

## 13. Configuración y Variables de Entorno

### 13.1 Variables Requeridas

```bash
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/database

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=your-account
AZURE_STORAGE_CONTAINER_NAME=your-container
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Google AI (Gemini)
GOOGLE_AI_API_KEY=your-api-key

# Aplicación
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_LIMIT=250
THROTTLER_ENABLED=true

# Cache
CACHE_TTL=7200000
CACHE_MAX_ITEMS=500

# Workers
ENABLE_WORKERS=true
WORKER_IDLE_TIMEOUT_MS=60000

# Email (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password
MAIL_FROM="AWBL <noreply@example.com>"

# URLs
FRONTEND_URL=http://localhost:5173
```

---

## 14. Despliegue

### 14.1 Docker

```yaml
# docker-compose.yml
services:
  awbl-db:
    image: postgres:alpine
    environment:
      - POSTGRES_DB=postgres
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - '5432:5432'

  awbl-redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  awbl-app:
    build: .
    ports:
      - '3000:3000'
    env_file:
      - .env
    depends_on:
      - awbl-db
      - awbl-redis
```

### 14.2 Comandos de Despliegue

```bash
# Build
npm run build

# Iniciar (con migraciones)
npm run start

# Solo producción (sin migraciones)
npm run start:prod

# Migraciones manuales
npm run migrate

# Seed de datos
npm run prisma:seed
```

### 14.3 Checklist de Despliegue

- [ ] Variables de entorno configuradas
- [ ] Base de datos PostgreSQL disponible
- [ ] Redis disponible
- [ ] Firebase configurado
- [ ] Azure Storage configurado
- [ ] Google AI API key configurada
- [ ] Migraciones ejecutadas
- [ ] Seed de roles ejecutado (si es primera vez)

---

## 15. Guías de Desarrollo

### 15.1 Crear un Nuevo Módulo

```bash
# 1. Generar módulo con NestJS CLI
nest g module modules/my-feature

# 2. Generar componentes
nest g controller modules/my-feature
nest g service modules/my-feature

# 3. Crear estructura de archivos
mkdir -p src/modules/my-feature/{dto,guards,types}
```

**Checklist:**
- [ ] Crear módulo en `src/modules/`
- [ ] Definir DTOs de entrada/salida
- [ ] Crear repository si accede a DB
- [ ] Implementar guards de autorización
- [ ] Agregar decoradores Swagger
- [ ] Importar módulo en `app.module.ts`
- [ ] Escribir tests unitarios

### 15.2 Agregar un Nuevo Endpoint

```typescript
// 1. Crear DTO
// dto/create-something.dto.ts
export class CreateSomethingDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

// 2. Agregar método al service
// something.service.ts
async create(dto: CreateSomethingDto): Promise<SomethingDto> {
  return this.repository.create(dto);
}

// 3. Agregar endpoint al controller
// something.controller.ts
@Post()
@UseGuards(AuthGuard, ProjectRoleGuard)
@RequireProjectRoles('owner', 'admin')
@ApiOperation({ summary: 'Create something' })
@ApiCreatedResponse({ type: SomethingDto })
async create(@Body() dto: CreateSomethingDto): Promise<SomethingDto> {
  return this.service.create(dto);
}
```

### 15.3 Agregar una Nueva Estrategia de IA

```typescript
// 1. Crear archivo de estrategia
// strategies/my-feature.strategy.ts
@Injectable()
export class MyFeatureStrategy implements AiGenerationStrategy<MyInput, MyOutput> {
  constructor(
    private promptBuilder: AiPromptBuilderService,
    private generationEngine: GeminiGenerationEngineService,
  ) {}

  async generate(input: MyInput): Promise<AiResponseWithUsage<MyOutput>> {
    const prompt = await this.promptBuilder.buildPrompt('my_feature', input);
    return this.generationEngine.generateStructuredOutput(prompt, MyOutputSchema);
  }
}

// 2. Crear archivo de prompt
// resources/prompts/prompt_my_feature.txt
[Tu prompt aquí con placeholders {{variable}}]

// 3. Registrar estrategia en el módulo
// ai.module.ts
providers: [
  MyFeatureStrategy,
  // ...
]
```

### 15.4 Trabajar con Migraciones

```bash
# Crear nueva migración después de cambiar schema.prisma
npx prisma migrate dev --name descriptive_name

# Aplicar migraciones en producción
npx prisma migrate deploy

# Resetear base de datos (no en producción)
npx prisma migrate reset

# Generar cliente de Prisma
npx prisma generate
```

---

## Apéndice A: Glosario

| Término | Descripción |
|---------|-------------|
| **Mandala** | Representación visual de un personaje o concepto con dimensiones y escalas |
| **Postit** | Nota/insight generada por IA ubicada en una posición específica de la mandala |
| **Dimensión** | Categoría de análisis (ej: "Social", "Económico", "Cultural") |
| **Escala** | Nivel de alcance (ej: "Individual", "Local", "Global") |
| **Provocación** | Pregunta provocadora para estimular la reflexión |
| **Enciclopedia** | Documento generado por IA que resume todo el conocimiento del proyecto |
| **Solution** | Propuesta de solución a un problema identificado |
| **Action Item** | Paso concreto para implementar una solución |

---

## Apéndice B: Referencias

- **Documentación de NestJS**: https://docs.nestjs.com/
- **Prisma Docs**: https://www.prisma.io/docs/
- **BullMQ**: https://docs.bullmq.io/
- **Firebase Admin SDK**: https://firebase.google.com/docs/admin/setup
- **Google AI (Gemini)**: https://ai.google.dev/docs
- **Azure Blob Storage**: https://docs.microsoft.com/en-us/azure/storage/blobs/

---

## Changelog del Manual

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 10-12-2025 | 1.0.0 | Versión inicial del manual |

---

*Este manual fue creado para facilitar la incorporación de nuevos desarrolladores y servir como referencia técnica del proyecto.*

