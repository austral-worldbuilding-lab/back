import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Required for BullMQ
    ...(process.env.REDIS_TLS === 'true' && {
      tls: {
        rejectUnauthorized: false,
      },
    }),
  },
  worker: {
    idleTimeout: parseInt(process.env.WORKER_IDLE_TIMEOUT_MS || '60000', 10), // 1 min default - tiempo antes de cerrar worker cuando esta en idle
  },
}));
