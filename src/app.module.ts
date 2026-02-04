import { HttpModule } from '@nestjs/axios';
import { Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as rTracer from 'cls-rtracer';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AuthModule } from './auth/auth.module';
import { TypeOrmConfigService } from './config/typeorm.config';
import { ContextModule } from './context/context.module';
import { AppContextService } from './context/app-context.service';
import { ThreatIntelModule } from './threat-intel/threat-intel.module';

const contextFormat = winston.format.printf((info) => {
  const rid = rTracer.id();
  const context = AppContextService.get();

  info.requestId = rid;
  if (context.apiClientId) {
    info.apiClientId = context.apiClientId;
  }
  if (context.merchant) {
    info.merchant = context.merchant;
  }

  return `requestId: ${rid}`;
});
let loggerConfig;
loggerConfig = {
  level: process.env.LOG_LEVEL,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        contextFormat,
        winston.format.timestamp(),
        winston.format.cli(),
      ),
    }),
  ],
};
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ContextModule,
    AuthModule,
    ThreatIntelModule,
    HttpModule,
    TerminusModule,
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    WinstonModule.forRoot(loggerConfig),
  ],
  controllers: [],
})
export class AppModule implements NestModule {}
