import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the current user from the JWT token payload.
 * This decorator works with JwtAuthGuard which sets the user in the request object.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@GetUser() user: any) {
 *   return user;
 * }
 *
 * @Get('user-id')
 * @UseGuards(JwtAuthGuard)
 * async getUserId(@GetUser('sub') userId: string) {
 *   return { userId };
 * }
 * ```
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
