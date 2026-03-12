import { 
  Injectable, // Makes class injectable
  CanActivate,  // Interface for guards
  ExecutionContext, // Provides request/response context
  UnauthorizedException 
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
// Makes this class injectable into controllers
export class WebhookAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}  // // Inject ConfigService to read WEBHOOK_SECRET from .env

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-webhook-secret'];
    const expected = this.config.get('webhookSecret');
    
    if (!secret || secret !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    
    return true;
  }
}