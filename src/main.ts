import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // Catch silent crashes that would otherwise just kill the process
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const normalizeOrigin = (origin: string) =>
    origin.trim().replace(/\/$/, '');

  const appUrl = normalizeOrigin(
    process.env.APP_URL ?? 'http://localhost:5173'
  );

  const additionalOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  const allowedOrigins = [appUrl, ...additionalOrigins];

  app.enableCors({
    origin: (origin) => {
      if (!origin) return true;

      return allowedOrigins.includes(normalizeOrigin(origin));
    },
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // 1. Use the environment PORT provided by the platform, fallback to 3000 locally
  const port = parseInt(process.env.PORT || '3000', 10);

  // 2. Explicitly bind to '0.0.0.0' so the platform can detect it
  await app.listen(port, '0.0.0.0');
  
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
}

bootstrap();