import { AppLogger } from '@common/services/logger.service';
import { Module, Global } from '@nestjs/common';

import { CacheService } from './services/cache.service';

@Global()
@Module({
  providers: [CacheService, AppLogger],
  exports: [CacheService, AppLogger],
})
export class CommonModule {}
