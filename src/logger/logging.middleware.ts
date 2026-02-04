import {
  Inject,
  Injectable,
  LoggerService,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { decode } from 'jsonwebtoken';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppContextService } from '../context/app-context.service';
import * as apm from 'elastic-apm-node';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}
  use(request: Request, response: Response, next: NextFunction) {
    const authHeader = request.get('Authorization') || '';
    //Extracting jwt claims for logging purposes. Validation is performed on the next steps.
    let clientId: string;
    let merchant: string;
    try {
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token: string = authHeader.substr(7, authHeader.length);
        const decodedToken = decode(token);
        clientId = decodedToken['client_id'];
        merchant = decodedToken['username'];
      }
    } catch (err) {
      this.logger.warn(
        'Unable to process jwt token from logging middleware. Continuing...',
      );
    }

    // Add context to APM transaction
    const transaction = apm.currentTransaction;
    if (transaction && clientId) {
      transaction.addLabels({
        apiClientId: clientId,
        merchant: merchant,
      });
    }

    // Store context for the entire request lifecycle
    AppContextService.run(
      {
        apiClientId: clientId,
        merchant: merchant,
      },
      () => {
        next();
      },
    );
  }
}
