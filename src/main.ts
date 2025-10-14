import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for all routes. Change for whitelist if needed.
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Only enable Swagger in development and staging environments
  const environment = process.env.NODE_ENV || 'development';
  if (environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AWBL API')
      .setDescription('Documentación de la API del backend del AWBL')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
