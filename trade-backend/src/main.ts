import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// Using require to avoid TS issues if @types/cookie-parser is missing
const cookieParser = require('cookie-parser');

async function bootstrap() {
  // Create NestJS app
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS for Vite frontend (allow 3000, 8080, and 5173)
  app.enableCors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      const allowed = [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:5173',
      ];
      if (allowed.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    exposedHeaders: ['set-cookie'],
  });

  // ✅ Enable cookie parsing (JWT in cookies)
  app.use(cookieParser());

  // ✅ Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ✅ Global API prefix
  app.setGlobalPrefix('api');
  

  // ✅ Backend port
  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`Backend running at http://localhost:${port}/api`);
  console.log(`Health Check: http://localhost:${port}/api/health`);
}

bootstrap();