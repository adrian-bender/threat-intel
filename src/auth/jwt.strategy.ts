import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuthConfig } from './auth.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authConfig: AuthConfig,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: false,
        jwksRequestsPerMinute: 5,
        jwksUri: `${authConfig.authority}/.well-known/jwks.json`,
        handleSigningKeyError: (err, cb) => {
          logger.error(err);
          return cb(err);
        },
      }),
    });
    logger.log(`Initializing JWT Authorization with ${authConfig.authority}`);
  }

  async validate(payload: any) {
    return { clientId: payload.client_id, merchant: payload.username };
  }
}
