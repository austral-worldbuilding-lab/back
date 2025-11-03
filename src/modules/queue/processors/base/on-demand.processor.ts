import { AppLogger } from '@common/services/logger.service';
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker, Queue } from 'bullmq';

/**
 * Interface that QueueServices must implement to be used by the base processor class.
 */
export interface QueueServiceProvider<
  TJobData extends BaseJobData,
  TJobResult,
> {
  getQueue(): Queue<TJobData, TJobResult>;
  registerProcessor?(
    processor: BaseOnDemandProcessor<TJobData, TJobResult>,
  ): void;
  notifyJobAdded?(): Promise<void>;
}

/**
 * Minimum constraint for JobData types.
 * All jobs must have at least a projectId.
 */
export interface BaseJobData {
  projectId: string;
}

/**
 * Redis connection configuration type for BullMQ.
 */
export interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: null;
  tls?: {
    rejectUnauthorized: boolean;
  };
}

/**
 * Abstract base class for Processors that implement on-demand strategy without polling.
 *
 * Handles all shared logic for on-demand workers:
 * - Worker initialization and shutdown
 * - Direct notifications from QueueService when jobs are added (no polling)
 * - Idle timeout to close workers when there's no work
 *
 *
 */
export abstract class BaseOnDemandProcessor<
    TJobData extends BaseJobData,
    TJobResult,
  >
  implements OnModuleInit, OnModuleDestroy
{
  protected worker: Worker<TJobData, TJobResult> | null = null;
  protected queue: Queue<TJobData, TJobResult> | null = null;
  protected idleTimeout: NodeJS.Timeout | null = null;
  protected isWorkerInitializing = false;
  protected redisConfig: RedisConnectionConfig | null = null;

  constructor(
    protected readonly configService: ConfigService,
    protected readonly logger: AppLogger,
    protected readonly queueService: QueueServiceProvider<TJobData, TJobResult>,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /**
   * Initializes the processor with on-demand strategy without polling.
   *
   * 1. Gets Queue from QueueService
   * 2. Registers itself in QueueService to receive notifications when jobs are added
   * 3. Checks for pending jobs on startup (only starts worker if there's work)
   *
   */
  async onModuleInit() {
    const redisConfig =
      this.configService.get<RedisConnectionConfig>('queue.redis')!;

    this.redisConfig = redisConfig;
    this.queue = this.queueService.getQueue();

    if (this.queueService.registerProcessor) {
      this.queueService.registerProcessor(
        this as unknown as BaseOnDemandProcessor<TJobData, TJobResult>,
      );
    }

    await this.checkAndStartWorkerIfNeeded(redisConfig);

    this.logger.log(
      `${this.getProcessorName()} processor initialized with on-demand worker`,
    );
  }

  /**
   * Ensures the worker is running.
   *
   * Can be called publicly from QueueService when a job is added.
   * If already initializing or running, does nothing.
   *
   * @param redisConfig - Optional Redis configuration (uses stored config if not provided)
   */
  public async ensureWorkerRunning(redisConfig?: RedisConnectionConfig) {
    const config: RedisConnectionConfig | null =
      redisConfig || this.redisConfig;

    if (!config) {
      this.logger.error('Cannot start worker: Redis config not available');
      return;
    }

    if (this.isWorkerInitializing || (this.worker && !this.worker.closing)) {
      return;
    }

    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }

    this.isWorkerInitializing = true;

    try {
      if (this.worker?.closing) {
        await this.worker.close();
        this.worker = null;
      }

      if (!this.worker) {
        this.worker = new Worker<TJobData, TJobResult>(
          this.getQueueName(),
          async (job: Job<TJobData>) => {
            return this.processJob(job);
          },
          {
            connection: config,
            concurrency: 1,
          },
        );

        this.setupWorkerEvents(config);

        this.logger.debug(`${this.getProcessorName()} worker started`);
      }
    } finally {
      this.isWorkerInitializing = false;
    }
  }

  /**
   * Sets up worker event handlers:
   * - completed: Logs when a job completes
   * - failed: Logs when a job fails
   * - drained: Schedules worker shutdown after idle timeout
   */
  protected setupWorkerEvents(_redisConfig: RedisConnectionConfig) {
    if (!this.worker) return;

    const workerConfig = this.configService.get<{
      idleTimeout: number;
    }>('queue.worker')!;

    this.worker.on('completed', (job: Job<TJobData>) => {
      this.logger.debug(
        `${this.getProcessorName()} job ${job.id} marked as completed`,
      );
    });

    this.worker.on('failed', (job: Job<TJobData> | undefined, err: Error) => {
      this.logger.error(
        `${this.getProcessorName()} job ${job?.id} failed for project ${job?.data.projectId}: ${err.message}`,
        { error: err.stack },
      );
    });

    this.worker.on('drained', () => {
      this.logger.debug(
        `${this.getProcessorName()} worker drained - scheduling idle timeout`,
      );

      if (this.idleTimeout) {
        clearTimeout(this.idleTimeout);
      }

      this.idleTimeout = setTimeout(() => {
        void this.closeWorkerIfIdle();
      }, workerConfig.idleTimeout);
    });
  }

  /**
   * Closes the worker if it's idle (no jobs in the queue).
   * Verifies there are no jobs in waiting, active, or delayed states.
   */
  protected async closeWorkerIfIdle() {
    if (!this.queue || !this.worker) return;

    try {
      const waiting = await this.queue.getWaitingCount();
      const active = await this.queue.getActiveCount();
      const delayed = await this.queue.getDelayedCount();

      if (waiting === 0 && active === 0 && delayed === 0) {
        this.logger.debug(`${this.getProcessorName()} worker closed (idle)`);

        if (this.worker && !this.worker.closing) {
          await this.worker.close();
        }
        this.worker = null;
      }
    } catch (error) {
      this.logger.error(
        `Error closing ${this.getProcessorName()} worker:`,
        error,
      );
    }
  }

  /**
   * Checks if there are pending jobs and the worker is not running.
   * Only used on module initialization (no periodic polling).
   *
   * @param redisConfig - Redis configuration
   */
  protected async checkAndStartWorkerIfNeeded(
    redisConfig: RedisConnectionConfig,
  ) {
    if (this.isWorkerInitializing) return;
    if (!this.queue) return;

    try {
      const waiting = await this.queue.getWaitingCount();
      const active = await this.queue.getActiveCount();
      const delayed = await this.queue.getDelayedCount();

      if (
        (waiting > 0 || active > 0 || delayed > 0) &&
        (!this.worker || this.worker.closing)
      ) {
        this.logger.debug(
          `${this.getProcessorName()} worker restarting for pending jobs`,
        );
        await this.ensureWorkerRunning(redisConfig);
      }
    } catch (error) {
      this.logger.error(
        `Error checking ${this.getQueueName()} queue status:`,
        error,
      );
    }
  }

  /**
   * Cleans up resources when destroying the module:
   * - Cancels timeouts
   * - Closes worker if running
   */
  async onModuleDestroy() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    if (this.worker && !this.worker.closing) {
      await this.worker.close();
    }

    this.logger.log(`${this.getProcessorName()} processor closed`);
  }

  /**
   * Abstract methods that must be implemented by derived classes.
   */

  /**
   * Processes a job. Each implementation must define its processing logic.
   *
   * @param job - The job to process
   * @returns The result of processing the job
   */
  protected abstract processJob(job: Job<TJobData>): Promise<TJobResult>;

  /**
   * Saves the result of a processed job.
   * Each implementation must define how and where to save the result.
   *
   * @param job - The processed job
   * @param result - The result to save
   */
  protected abstract saveResult(
    job: Job<TJobData>,
    result: TJobResult,
  ): Promise<void>;

  /**
   * Returns the queue name (e.g., 'encyclopedia-generation').
   * Used for logs and to create the Worker.
   *
   * @returns The queue name
   */
  protected abstract getQueueName(): string;

  /**
   * Returns the processor name (e.g., 'Encyclopedia').
   * Used for descriptive logs.
   *
   * @returns The processor name
   */
  protected abstract getProcessorName(): string;
}
