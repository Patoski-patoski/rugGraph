import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RugGraphException } from '../exceptions/base.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const code =
      exception instanceof RugGraphException
        ? exception.code
        : exception instanceof HttpException
        ? 'HTTP_ERROR'
        : 'INTERNAL_SERVER_ERROR';

    let message = 'An unexpected server error occurred.';
    let errors: unknown = undefined;

    if (exception instanceof RugGraphException) {
      message = exception.message;
    } else if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = typeof resObj['message'] === 'string' ? resObj['message'] : exception.message;
        errors = resObj['errors'];
      } else if (typeof res === 'string') {
        message = res;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (exception instanceof RugGraphException) {
      this.logger.warn({
        code: exception.code,
        context: exception.context,
        path: request.url,
        status,
      });
    } else {
      this.logger.error({
        error: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        path: request.url,
        status,
      });
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      ...(errors ? { errors } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
