export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface ServiceHealth {
  status: HealthStatus;
  responseTime: number;
  details: string;
  error?: string;
}

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    firebase: ServiceHealth;
    azureStorage: ServiceHealth;
    ai: ServiceHealth;
  };
}
