import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for all routes. Change for whitelist if needed.
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
