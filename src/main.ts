import apm from 'elastic-apm-node';
if (process.env.NODE_ENV === 'production') {
  apm.start();
} else {
  apm.start({ active: false });
}
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import * as rTracer from 'cls-rtracer';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    rTracer.expressMiddleware({
      useHeader: true,
      headerName: 'x-request-id',
    }),
  );
  app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(8080);
}

bootstrap();
