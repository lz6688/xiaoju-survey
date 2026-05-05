import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthenticationException } from '../exceptions/authException';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { UserService } from 'src/modules/auth/services/user.service';
import { getClientIp } from 'src/utils/requestMeta';

@Injectable()
export class Authentication implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AuthenticationException('请登录');
    }

    try {
      const user = await this.authService.verifyToken(token);
      request.user = user;
      await this.userService.updateActiveAudit({
        userId: user._id.toString(),
        ip: getClientIp(request),
      });
      return true;
    } catch (error) {
      throw new AuthenticationException(error?.message || '用户凭证错误');
    }
  }
}
