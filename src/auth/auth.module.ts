import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthConfig } from './auth.config';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy, AuthConfig],
  exports: [],
})
export class AuthModule {}
