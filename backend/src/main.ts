import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildCorsOptions } from './infrastructure/security/CorsConfig';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The admin UI is a separate project on another origin.
  app.enableCors(buildCorsOptions(app.get(ConfigService)));

  const config = new DocumentBuilder()
    .setTitle('Developer User Module API')
    .setDescription(
      'Users, roles, permissions, and role permissions for the Developer platform',
    )
    .setVersion('1.0')
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
