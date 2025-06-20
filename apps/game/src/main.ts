import { NestFactory } from '@nestjs/core';
import { GameModule } from './game.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(GameModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'], // or use a custom logger
  });

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  logger.log(`🚀 GameModule is running on http://localhost:${port}`);
}
bootstrap();
