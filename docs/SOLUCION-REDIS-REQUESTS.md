
# Solución: Eliminar Requests Excesivos a Upstash Redis

## 🎯 Problema
Upstash Redis reporta ~500,000 requests/día sin tener jobs activos.

## 🔍 Causa
Los Workers de BullMQ hacen polling constante a Redis (cada 5 segundos) para verificar si hay nuevos jobs, incluso cuando no hay trabajos en cola.

## ✅ Solución Rápida

### Paso 1: Crear Flag de Configuración

Modificar `src/modules/queue/queue.config.ts`:

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    ...(process.env.REDIS_TLS === 'true' && {
      tls: {
        rejectUnauthorized: false,
      },
    }),
  },
  enableWorkers: process.env.ENABLE_WORKERS !== 'false',
}));
```

### Paso 2: Modificar EncyclopediaProcessor

Agregar verificación del flag en `src/modules/queue/processors/encyclopedia.processor.ts`:

```typescript
onModuleInit() {
  const enableWorkers = this.configService.get<boolean>('queue.enableWorkers');
  
  if (!enableWorkers) {
    this.logger.warn('Workers disabled via ENABLE_WORKERS=false');
    return;
  }

  const redisConfig = this.configService.get<{
    host: string;
    port: number;
    password?: string;
    maxRetriesPerRequest: null;
  }>('queue.redis')!;

  this.worker = new Worker<EncyclopediaJobData, EncyclopediaJobResult>(
    'encyclopedia-generation',
    async (job: Job<EncyclopediaJobData>) => {
      return this.processEncyclopediaJob(job);
    },
    {
      connection: redisConfig,
      concurrency: 1,
    },
  );

  // ... resto del código
}
```

### Paso 3: Modificar SolutionsProcessor

Agregar la misma verificación en `src/modules/queue/processors/solutions.processor.ts`:

```typescript
onModuleInit() {
  const enableWorkers = this.configService.get<boolean>('queue.enableWorkers');
  
  if (!enableWorkers) {
    this.logger.warn('Workers disabled via ENABLE_WORKERS=false');
    return;
  }

  const redisConfig = this.configService.get<{
    host: string;
    port: number;
    password?: string;
    maxRetriesPerRequest: null;
  }>('queue.redis')!;

  this.worker = new Worker<SolutionsJobData, SolutionsJobResult>(
    'solutions-generation',
    async (job: Job<SolutionsJobData>) => {
      return this.processSolutionsJob(job);
    },
    {
      connection: redisConfig,
      concurrency: 1,
    },
  );

  // ... resto del código
}
```

### Paso 4: Agregar Variable de Entorno

En el archivo de configuración de Azure/producción, agregar:

```bash
ENABLE_WORKERS=false
```

## 📊 Impacto Esperado

**Antes**:
- 2 Workers × 12 polls/minuto = 24 polls/minuto
- ~500,000 requests/día

**Después**:
- 0 polls/minuto (Workers deshabilitados)
- ~0 requests de workers/día

**Reducción: ~100%** de requests de workers

## ⚠️ Importante

Los jobs pueden seguir siendo encolados usando `queue.add()`, pero **no serán procesados** hasta que los Workers estén habilitados.

### Alternativa: Workers Separados

Para mantener la funcionalidad, crear un proceso separado que solo ejecute Workers:

```
├── API Server (ENABLE_WORKERS=false) ← Menos costo
└── Worker Server (ENABLE_WORKERS=true) ← Procesa jobs
```

Ver: `docs/REDIS-BULLMQ-ANALISIS.md` para más detalles.

## 🧪 Testing

Después de la implementación:

1. Desplegar con `ENABLE_WORKERS=false`
2. Monitorear Upstash Redis dashboard
3. Verificar que requests bajen a ~0
4. Verificar que jobs se encolan correctamente
5. (Si aplica) Verificar que jobs se procesan desde worker separado

---

**Referencia**: `docs/REDIS-BULLMQ-ANALISIS.md` para análisis detallado.




