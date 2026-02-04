import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return process.env.DB_CACHING_ENABLED === 'true'
      ? {
          type: 'mysql',
          replication: {
            master: {
              host: process.env.DB_WRITE_HOST,
              port: parseInt(process.env.DB_PORT),
              username: process.env.DB_USERNAME,
              password: process.env.DB_PASSWORD,
              database: process.env.DB_DATABASE,
            },
            slaves: [
              {
                host: process.env.DB_READ_HOST,
                port: parseInt(process.env.DB_PORT),
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DATABASE,
              },
            ],
          },
          logging: process.env.DB_LOG_QUERIES === 'true',
          entities: [],
          synchronize: false,
          ssl: false,
          debug: false,
          extra: {
            connectionLimit: parseInt(process.env.DATABASE_POOL_SIZE) || 10,
          },
          cache: {
            type: 'ioredis',
            options: {
              host: process.env.REDIS_HOSTNAME,
              port: Number(process.env.REDIS_PORT),
              password: process.env.REDIS_PASSWORD,
              connectTimeout: 5000,
              lazyConnect: true,
              maxRetriesPerRequest: null,
              retryDelayOnFailover: 100,
              enableOfflineQueue: false,
            },
            ignoreErrors: true,
          },
        }
      : {
          type: 'mysql',
          replication: {
            master: {
              host: process.env.DB_WRITE_HOST,
              port: parseInt(process.env.DB_PORT),
              username: process.env.DB_USERNAME,
              password: process.env.DB_PASSWORD,
              database: process.env.DB_DATABASE,
            },
            slaves: [
              {
                host: process.env.DB_READ_HOST,
                port: parseInt(process.env.DB_PORT),
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DATABASE,
              },
            ],
          },
          logging: process.env.DB_LOG_QUERIES === 'true',
          entities: [],
          synchronize: false,
          ssl: false,
          debug: false,
          extra: {
            connectionLimit: parseInt(process.env.DATABASE_POOL_SIZE) || 10,
          },
        };
  }
}
