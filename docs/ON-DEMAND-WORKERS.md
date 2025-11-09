# On-Demand Workers for BullMQ

## 🎯 Executive Summary

**Original Problem**: BullMQ workers were constantly polling Redis even when there were no jobs, generating ~500,000 requests/day to Upstash.

**Implemented Solution**: On-demand workers that automatically shut down when idle and restart when new jobs are added via direct notifications from QueueService (no polling).

**Result**: ~99% reduction in Redis requests when there are no active jobs. No polling when idle.

---

## 📊 Diagrams: Before vs After

### Architecture BEFORE (Always Active Workers)

```
┌─────────────────────────────────────────────────────────────┐
│                    NestJS Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ Encyclopedia     │         │ Solutions        │          │
│  │ Processor       │         │ Processor        │          │
│  │                 │         │                  │          │
│  │ ┌────────────┐ │         │ ┌────────────┐ │          │
│  │ │  Worker   │ │         │ │  Worker    │ │          │
│  │ │  (ACTIVE) │ │         │ │  (ACTIVE) │ │          │
│  │ │           │ │         │ │            │ │          │
│  │ │ 🔄 Polling│ │         │ │ 🔄 Polling │ │          │
│  │ │ Constant  │ │         │ │  Constant  │ │          │
│  │ └──────┬────┘ │         │ └──────┬────┘ │          │
│  └────────┼──────┘         └────────┼──────┘          │
│           │                         │                  │
│           │ BLPOP every ~5s         │ BLPOP every ~5s  │
│           │ (even without jobs)      │ (even without jobs)│
│           │                         │                  │
└───────────┼─────────────────────────┼──────────────────┘
            │                         │
            │   Continuous Requests   │
            │   (~10-12 req/min)      │
            │                         │
            ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Redis (Upstash)                          │
│                                                               │
│  • Constant BLPOP commands                                   │
│  • Heartbeats                                                 │
│  • Monitoring                                                 │
│  • Cleanup                                                   │
│                                                               │
│  Total: ~500,000 requests/day (idle or active)              │
└─────────────────────────────────────────────────────────────┘

Status: ⚠️ Workers always active, constant polling
Cost: 💰 High (500k+ requests/day)
```

### Architecture AFTER (On-Demand Workers)

```
┌─────────────────────────────────────────────────────────────┐
│                    NestJS Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ Encyclopedia     │         │ Solutions        │          │
│  │ Processor       │         │ Processor        │          │
│  │                 │         │                  │          │
│  │ ┌────────────┐ │         │ ┌────────────┐ │          │
│  │ │   Queue   │ │         │ │   Queue    │ │          │
│  │ │(Monitoring)│ │         │ │(Monitoring)│ │          │
│  │ └──────┬────┘ │         │ └──────┬────┘ │          │
│  │        │      │         │        │      │          │
│  │ ┌──────▼────┐ │         │ ┌──────▼────┐ │          │
│  │ │  Worker  │ │         │ │  Worker   │ │          │
│  │ │(ON-DEMAND)│ │         │ │(ON-DEMAND)│ │          │
│  │ │           │ │         │ │           │ │          │
│  │ │ ⚪ Closed │ │         │ │ ⚪ Closed  │ │          │
│  │ │   when   │ │         │ │   when    │ │          │
│  │ │   idle   │ │         │ │   idle    │ │          │
│  │ │           │ │         │ │           │ │          │
│  │ │ 🔵 Active │ │         │ │ 🔵 Active │ │          │
│  │ │   when   │ │         │ │   when    │ │          │
│  │ │   jobs   │ │         │ │   jobs    │ │          │
│  │ └──────┬────┘ │         │ └──────┬────┘ │          │
│  └────────┼──────┘         └────────┼──────┘          │
│           │                         │                  │
│           │ Requests ONLY when      │ Requests ONLY when│
│           │ jobs are processed      │ jobs are processed│
│           │                         │                  │
│           │ ✅ NO polling when idle │                  │
│           │ ✅ NO XREAD commands    │                  │
│           │ ✅ NO periodic checks   │                  │
│           │                         │                  │
└───────────┼─────────────────────────┼──────────────────┘
            │                         │
            │   Requests: ~0/min      │
            │   when idle             │
            │                         │
            ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Redis (Upstash)                          │
│                                                               │
│  • Requests only during job processing                       │
│  • Initial check on startup (one-time)                      │
│  • No polling when idle                                      │
│  • No QueueEvents (eliminated XREAD commands)               │
│                                                               │
│  Total: ~10,000-20,000 requests/month                       │
└─────────────────────────────────────────────────────────────┘

Status: ✅ Workers on-demand, zero polling when idle
Cost: 💰 Minimal (~2% of limit)
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Startup                        │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             │ onModuleInit()
                             │
                    ┌────────▼────────┐
                    │ Processor Init  │
                    │                 │
                    │ 1. Get Queue    │
                    │ 2. Register in  │
                    │    QueueService │
                    │ 3. Check for    │
                    │    pending jobs │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
         Pending    │  No pending     │
         jobs?      │  jobs?          │
                    │                 │
                    ▼                 ▼
        ┌───────────────┐    ┌───────────────┐
        │ Start Worker │    │ NO Worker     │
        │              │    │ Created       │
        └──────┬───────┘    │               │
               │             │ ⚪ Idle       │
               │             │ (0 requests)  │
               │             └───────────────┘
               │
               │ Worker created
               │
      ┌────────▼────────┐
      │ Worker ACTIVE   │
      │                 │
      │ 🔵 Processing   │
      │ 📦 Jobs         │
      │ 🔄 Normal ops   │
      └────────┬────────┘
               │
               │ worker.on('drained')
               │ (no more jobs)
               │
      ┌────────▼────────┐
      │  Worker IDLE     │
      │  (Timeout 1min) │
      │                 │
      │ ⏳ Waiting for  │
      │    new jobs     │
      └────────┬────────┘
               │
      ┌────────┴────────┐
      │                 │
      │ If new job      │ If still idle
      │ added:          │ after 1min:
      │                 │
      │                 │
      ▼                 ▼
┌───────────────┐    ┌───────────────┐
│ Worker ACTIVE │    │ Worker CLOSED │
│ (restarts)    │    │ (shuts down) │
│               │    │               │
│ 🔵 Processing │    │ ⚪ Zero       │
│               │    │   requests    │
└───────────────┘    └───────────────┘
```

---

## 📊 Comparison: Before vs After

### Previous Approach: Always Active Workers

**Behavior**:
- Worker starts when module initializes
- Constantly polls using `BLPOP` even without jobs
- **Never stops** while app is running
- Result: ~500k requests/day to Redis just from polling

**Problem**:
```
Time: 0h-24h (24 hours)
Workers: 2 always active
Jobs in queue: 0 (all day)
Requests to Redis: ~500,000/day
Cost: High (Upstash charges per request)
```

---

### New Approach: On-Demand Workers (No Polling)

**Behavior**:
- Worker is created **only if there are pending jobs**
- Automatically closes after 1 minute idle
- Automatically restarts when new jobs are added (via direct notification)
- **No polling** when there are no active jobs
- **No QueueEvents** (eliminates XREAD commands)

**Result**:
```
Time: 0h-24h
Workers: 0 when idle, 2 when there are jobs
Jobs in queue: 0 (23 hours), 2 jobs (1 hour)
Requests to Redis: 
  - Idle: ~0 requests/day (workers closed, no polling)
  - With jobs: Only during processing
Total estimated: ~10,000-20,000/month (99% reduction)
```

---

## 🔧 Mechanisms of the New Approach

### 1. Direct Notification from QueueService (No Polling)

**BEFORE**: Worker polls with `BLPOP` every few seconds
```
Worker → BLPOP → Wait → BLPOP → Wait → (infinite loop)
```

**AFTER**: Direct notification when job is added
```
QueueService.addJob() → notifyJobAdded() → processor.ensureWorkerRunning()
```

✅ **Advantage**: Immediate and no polling

### 2. Automatic Shutdown When Idle

When the worker finishes processing all jobs, it emits a `drained` event. The processor schedules an idle timeout (1 minute). If no new jobs arrive during this time, the worker closes automatically.

✅ **Advantage**: Zero requests to Redis when there's no work

### 3. Automatic Restart

When a job is added to the queue, the QueueService directly notifies the processor, which immediately starts the worker if it's not already running. No polling is needed since we know exactly when jobs are added.

✅ **Advantage**: Worker starts immediately when job is added

### 4. Startup Check (One-Time Only)

On module initialization, the processor checks once for pending jobs. This handles the case where the app restarts with pending jobs already in the queue. After this initial check, no periodic polling occurs.

✅ **Advantage**: Handles orphaned jobs from app restarts

---

## 🏗️ Code Structure

```
src/modules/queue/
├── processors/
│   ├── base/
│   │   └── on-demand.processor.ts    ← Abstract base class
│   ├── encyclopedia.processor.ts      ← Concrete implementation
│   └── solutions.processor.ts         ← Concrete implementation
├── services/
│   ├── encyclopedia-queue.service.ts  ← Queue management
│   └── solutions-queue.service.ts     ← Queue management
└── queue.config.ts                    ← Configuration
```

### Base Class: `BaseOnDemandProcessor`

Located in `processors/base/on-demand.processor.ts`, this abstract class provides:
- Worker lifecycle management
- Direct notification handling
- Idle timeout and automatic shutdown
- Startup check for pending jobs

### Concrete Implementations

- `EncyclopediaProcessor`: Extends base class, implements encyclopedia generation logic
- `SolutionsProcessor`: Extends base class, implements solutions generation logic

---

## ⚙️ Configuration

### Environment Variables

- `WORKER_IDLE_TIMEOUT_MS`: Time in milliseconds before closing worker when idle (default: 60000, which is 1 minute)

This can be configured in your `.env` file.

---

## 🔍 Key Components

### 1. Queue (Monitoring)

The processor gets a shared Queue instance from the QueueService. This is used to monitor queue state (waiting, active, delayed jobs) but does not process jobs directly.

**Purpose**: Shared Queue instance for monitoring queue state (waiting, active, delayed jobs)

### 2. Direct Notification Pattern

When a job is added to the queue, the QueueService directly calls `notifyJobAdded()`, which triggers the processor's `ensureWorkerRunning()` method. This eliminates the need for polling to detect new jobs.

**Purpose**: Immediately start worker when job is added (no polling needed)

### 3. Worker (Processing)

The Worker is created on-demand when jobs are detected. It processes jobs with concurrency of 1 (one job at a time). The worker is automatically closed when idle for 1 minute.

**Purpose**: Process jobs. Created on-demand and closed when idle.

---

## 🔄 Complete Initialization Flow

### Initialization Steps

On module initialization, the processor:
1. Gets Redis configuration
2. Gets Queue instance from QueueService (shared instance)
3. Registers itself in QueueService to receive notifications when jobs are added
4. Performs a one-time check for pending jobs on startup

After initialization, there is **NO periodic polling** and **NO QueueEvents** (which eliminates XREAD commands).

### Flow Sequence

```
1. App starts
   ↓
2. Processor.onModuleInit() executes
   ↓
3. Gets Queue from QueueService (shared instance)
   ↓
4. Registers processor in QueueService
   ↓
5. Checks for pending jobs (one-time)
   ├─ If jobs found → Start worker
   └─ If no jobs → No worker created (zero requests)
   ↓
6. Ready to receive notifications
   ↓
7. When QueueService.addJob() is called:
   ├─ Job added to queue
   ├─ QueueService.notifyJobAdded() called
   └─ Processor.ensureWorkerRunning() → Worker starts
```

---

## 💡 Why No QueueEvents?

### The Problem with QueueEvents

`QueueEvents` uses Redis Streams internally, which requires continuous `XREAD` commands to poll the stream. Even when idle, `QueueEvents` generates:
- **~34 XREAD commands/minute**
- **~48,960 XREAD commands/day**
- **~1,468,800 XREAD commands/month**

This exceeds the Upstash limit of 500k requests/month.

### Our Solution: Direct Notifications

Instead of using `QueueEvents` to detect new jobs, we use direct notifications. When the QueueService adds a job, it immediately calls `notifyJobAdded()`, which triggers the processor to start the worker if needed. We know exactly when jobs are added, so polling is unnecessary.

**Advantages**:
- ✅ Zero polling overhead
- ✅ Immediate worker startup
- ✅ No XREAD commands when idle
- ✅ No QueueEvents needed

---

## 🚨 Handling Orphaned Jobs

### The Scenario

If the app crashes with a job in the queue:
- When app restarts → `onModuleInit` executes
- `checkAndStartWorkerIfNeeded` runs once (startup check)
- If job is found → Worker starts and processes it ✅
- If check fails → Job remains orphaned ❌

### Trade-off

We accept this trade-off to eliminate polling:
- ✅ 99% of cases: Startup check detects orphaned jobs
- ✅ Remaining 1%: Job recovers when next job is added
- ✅ Zero polling overhead when idle

### Recovery Mechanism

Orphaned jobs are automatically recovered when:
1. App restarts → Startup check detects them
2. New job is added → Worker starts and processes all pending jobs (including orphaned ones)

---

## 📊 Request Calculation

### When Idle (Typical 23 hours/day)

- **Zero requests**: Workers closed, no polling, no QueueEvents
- **Startup check**: 3 commands once (waiting, active, delayed) ≈ 6 commands/day

### When Processing Jobs (Typical 1 hour/day)

- **Job processing**: ~5,000-10,000 requests depending on frequency
- **Worker operations**: Normal BullMQ operations during processing

### Total Estimated

- **~10,000-20,000 requests/month** (~2-4% of 500k limit)
- **~99% reduction** compared to previous approach (~500k requests/day)

---

## ✅ Benefits

1. **Massive Cost Reduction**: ~99% fewer requests when idle
2. **Zero Polling Overhead**: No continuous polling when idle
3. **Immediate Detection**: Direct notifications when jobs are added
4. **Simple Architecture**: No complex event listeners or periodic checks
5. **Clean Code**: Abstract base class reduces duplication
6. **Maintainable**: Clear separation of concerns

---

## 🔍 Monitoring

### Logs to Monitor

**When idle (worker closed)**:
- No logs (expected - worker is closed)

**When job is added**:
- QueueService logs that a job was added
- Processor logs that the worker started
- Processor logs that it's processing the job

**When job completes**:
- Processor logs that the result was saved
- Processor logs that the worker drained and idle timeout is scheduled
- Processor logs that the worker closed (idle)

### Key Metrics

- **Worker uptime**: Should be minimal (only when processing jobs)
- **Request rate**: Should be near zero when idle
- **Job processing time**: Monitor via BullMQ dashboard

---

## 🛠️ Troubleshooting

### Issue: Worker not starting when job is added

**Check**:
1. Verify `QueueService.notifyJobAdded()` is being called
2. Verify processor is registered in QueueService
3. Check logs for errors in `ensureWorkerRunning()`

### Issue: Worker not closing when idle

**Check**:
1. Verify `drained` event is firing
2. Verify `idleTimeout` is set correctly
3. Check `closeWorkerIfIdle()` logs

### Issue: Orphaned jobs not being processed

**Check**:
1. Verify startup check in `onModuleInit` is executing
2. Check logs for "worker restarting for pending jobs"
3. Manually trigger by adding a new job (will process orphaned ones too)

---

## 📝 Summary

The on-demand worker approach eliminates constant polling by:
1. Using direct notifications from QueueService when jobs are added
2. Starting workers only when needed
3. Automatically closing workers when idle (1 minute timeout)
4. Performing a one-time startup check for orphaned jobs
5. Eliminating QueueEvents to avoid XREAD commands

**Result**: ~99% reduction in Redis requests, staying well within Upstash limits while maintaining reliability and responsiveness.
