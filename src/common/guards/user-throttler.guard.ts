import { User } from '@modules/user/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

interface RequestForThrottle {
  user?: User;
  ip?: string;
  connection?: {
    remoteAddress?: string;
  };
}

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: RequestForThrottle): Promise<string> {
    // If user is authenticated, track by user ID
    if (req.user?.id) {
      return Promise.resolve(`user:${req.user.id}`);
    }

    // If not authenticated, track by IP address
    return Promise.resolve(
      `ip:${req.ip || req.connection?.remoteAddress || 'unknown'}`,
    );
  }
}
