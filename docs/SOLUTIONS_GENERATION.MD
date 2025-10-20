# 🎯 AI Solutions Generation Feature

## Overview

The AI Solutions Generation feature is a crucial component of the worldbuilding process that generates concrete, actionable solutions based on project encyclopedia content. This feature completes the worldbuilding pipeline by transforming identified problems into viable solutions.

## 🚀 Features

- **AI-Powered Solution Generation**: Uses Gemini AI to generate contextual solutions
- **Encyclopedia Integration**: Automatically generates and uses project encyclopedia as knowledge base
- **Asynchronous Processing**: Queue-based generation with real-time status tracking
- **Caching System**: Stores generated solutions in Redis cache for fast retrieval
- **Job Pipeline**: BullMQ-powered pipeline with dependency management
- **Impact Assessment**: Solutions include impact level and detailed impact descriptions

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Solution       │    │  AI Strategy     │    │  Queue          │
│  Controller     │───▶│  Solutions       │───▶│  Solutions      │
│                 │    │  Strategy        │    │  Processor      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Solution       │    │  AI Prompt       │    │  Encyclopedia   │
│  Service        │    │  Builder         │    │  Queue Service  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Cache          │    │  Gemini          │    │  BullMQ         │
│  Service        │    │  Adapter         │    │  Pipeline       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow

1. **Request**: User triggers solution generation via API
2. **Queue**: Job is added to solutions queue
3. **Encyclopedia**: If needed, encyclopedia generation is triggered and waited for
4. **AI Generation**: Solutions are generated using project data and encyclopedia
5. **Caching**: Generated solutions are stored in Redis cache
6. **Response**: User can retrieve solutions from cache or check job status

## 📋 API Endpoints

### Generate Solutions
```http
POST /project/{projectId}/solutions/generate
```

**Description**: Queues a job to generate AI-powered solutions for a project.

**Headers**:
```
Authorization: Bearer <firebase-token>
```

**Response**:
```json
{
  "jobId": "solutions-a1b2c3d4-e5f6-7890-1234-567890abcdef-1678886400000",
  "message": "Solutions generation job has been queued"
}
```

### Check Generation Status
```http
GET /project/{projectId}/solutions/generate/status
```

**Description**: Retrieves the status of the solutions generation job.

**Response**:
```json
{
  "jobId": "solutions-a1b2c3d4-e5f6-7890-1234-567890abcdef-1678886400000",
  "status": "completed",
  "progress": 100,
  "solutions": [
    {
      "title": "Sustainable Celebration Center",
      "description": "Creation of a dedicated space for graduation celebrations...",
      "problem": "Current celebrations generate disorder and environmental impact...",
      "impactLevel": "HIGH",
      "impactDescription": "This solution addresses multiple problems through dedicated infrastructure..."
    }
  ],
  "createdAt": "2023-03-15T10:00:00.000Z",
  "processedAt": "2023-03-15T10:05:00.000Z",
  "finishedAt": "2023-03-15T10:10:00.000Z"
}
```

### Get Cached Solutions
```http
GET /project/{projectId}/solutions/cached
```

**Description**: Retrieves previously generated solutions from cache.

**Response**:
```json
[
  {
    "title": "Sustainable Celebration Center",
    "description": "Creation of a dedicated space for graduation celebrations...",
    "problem": "Current celebrations generate disorder and environmental impact...",
    "impactLevel": "HIGH",
    "impactDescription": "This solution addresses multiple problems through dedicated infrastructure..."
  }
]
```

## 🔄 Job Pipeline

### BullMQ Integration

The solutions generation uses BullMQ's native job pipeline features:

```typescript
// Job Dependency Chain
SolutionsJob => EncyclopediaJob => AIGeneration => CacheStorage
```


**Key Features**:
- **waitUntilFinished**: Native BullMQ dependency resolution
- **Event-driven**: Uses BullMQ's event system instead of polling
- **Retry Logic**: Automatic retry with exponential backoff
- **Job Cleanup**: Automatic cleanup of completed/failed jobs

### Job States

- `waiting`: Job queued, waiting for processing
- `active`: Job currently being processed
- `completed`: Job finished successfully
- `failed`: Job failed with error
- `delayed`: Job scheduled for later execution

## 💾 Caching Strategy

### Cache Keys
```
ai:solutions:project:{projectId}
```

### Cache Configuration
- **Limit**: 20 solutions per cache key
- **TTL**: Managed by Redis configuration
- **Storage**: Individual solution objects in Redis list
- **Scope**: Project-global (shared across all users of the project)

### Cache Operations
- **Save**: `addToLimitedCache()` - Adds solutions to cache with limit
- **Retrieve**: `getFromCache()` - Retrieves all cached solutions
- **Management**: Automatic cleanup and size management
- **Key Strategy**: Project-based caching (not user-specific)

## 🛠️ Implementation Details

### Key Files

```
src/modules/solution/
├── solution.controller.ts          # API endpoints
├── solution.service.ts             # Business logic
├── decorators/
│   ├── generate-solutions.decorator.ts
│   ├── get-solutions-status.decorator.ts
│   └── get-cached-solutions.decorator.ts
├── dto/
│   ├── solutions-job-response.dto.ts
│   └── solutions-job-status.dto.ts
└── types/
    └── solutions.type.ts
src/modules/ai/
├── strategies/solutions.strategy.ts    # AI strategy implementation
├── resources/prompts/
│   └── prompt_generar_soluciones.txt   # Prompt template
└── services/
    └── ai-prompt-builder.service.ts    # Prompt building logic
src/modules/queue/
├── services/solutions-queue.service.ts # Queue management
├── processors/solutions.processor.ts   # Job processing
└── types/solutions-job.types.ts        # Job type definitions
```

### Dependencies

- **Encyclopedia Generation**: Solutions always generate fresh encyclopedia
- **AI Service**: Uses Gemini AI with structured output
- **Cache Service**: Redis-based caching for performance
- **Project Service**: Project data and validation
- **Queue Service**: BullMQ for asynchronous processing

## 🚦 Error Handling

### Common Error Scenarios

1. **Missing Encyclopedia**: Automatically generates encyclopedia
2. **AI Service Errors**: Retry with exponential backoff
3. **Cache Failures**: Graceful degradation, solutions still generated
4. **Queue Failures**: Job retry mechanism
5. **Validation Errors**: Clear error messages with validation details

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "A solutions generation is already in progress for this project",
  "error": "Bad Request"
}
```

## 📊 Monitoring and Observability

### Logging

All operations are logged with structured logging:

```typescript
// Job lifecycle
this.logger.log(`Solutions job ${jobId} queued for project ${projectId}`);
this.logger.log(`Solutions job ${jobId} completed for project ${projectId}`);

// AI operations
this.logger.log(`Generated ${solutions.length} solutions for project: ${projectId}`);
```

### Metrics

- Job completion rates
- AI token usage tracking
- Cache hit/miss ratios
- Processing times

## 🔒 Security and Permissions

### Authentication
- Firebase JWT token required
- User context validation

### Authorization
- Project role-based access control
- Required roles: `member`, `owner`, `admin`
- Project ownership validation

### Rate Limiting
- Throttled to 10 requests per hour per user
- Prevents abuse of AI generation resources
