import { NestFactory } from '@nestjs/core';
import { WalletModule } from './wallet.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('WalletBootstrap');

  const app = await NestFactory.create(WalletModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'], // You can limit levels here if needed
  });

  const port = process.env.PORT ?? 4000;

  await app.listen(port);

  logger.log(`🚀 WalletModule is running on http://localhost:${port}`);
}
bootstrap();
