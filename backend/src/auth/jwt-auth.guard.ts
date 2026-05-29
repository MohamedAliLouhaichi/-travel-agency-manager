import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add custom authentication logic here if needed
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Throw an exception if no user is authenticated or if user is inactive
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('Your account is deactivated');
    }
    return user;
  }
}
