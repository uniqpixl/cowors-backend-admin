import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import 'dotenv/config';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GlobalConfig } from '../config/config.type';

const enableSentry = (err: Error, context: ExecutionContext) => {
  if (err instanceof HttpException) {
    return throwError(() => err);
  }

  Sentry.withScope((scope) => {
    scope.addEventProcessor(async (event) =>
      Sentry.addRequestDataToEvent(event, context.getArgs()[0]),
    );
    Sentry.captureException(err);
  });

  return throwError(() => err);
};

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService<GlobalConfig>) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const sentryLogging = this.configService.get('sentry.logging', {
      infer: true,
    });
    if (sentryLogging) {
      return next
        .handle()
        .pipe(catchError((err) => enableSentry(err, context)));
    }
    return next.handle().pipe(catchError((err) => throwError(() => err)));
  }
}
