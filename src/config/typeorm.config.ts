import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'sqlite',
      database: join(process.cwd(), process.env.DATABASE_PATH || 'threat_intel.db'),
      entities: [],
      synchronize: false,
      logging: process.env.DB_LOG_QUERIES === 'true',
    };
  }
}
