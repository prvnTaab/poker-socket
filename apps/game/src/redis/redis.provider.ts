


import Redis from 'ioredis';
import { Provider } from '@nestjs/common';

export const RedisProvider: Provider = {
  provide: 'REDIS',
  useFactory: () => {
    return new Redis({ host: 'localhost', port: 6379 });
  },
};
