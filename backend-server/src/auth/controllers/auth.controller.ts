import {
  All,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from '../auth.service';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Simple login endpoint for NextAuth.js
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    try {
      const { email, password } = body;
      const result = await this.authService.signIn(email, password);

      if (result.success) {
        // Set cookie and return success
        res.setCookie('auth-token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          path: '/',
        });

        return res.status(200).send({
          success: true,
          user: result.user,
          token: result.token, // Include token for NextAuth
        });
      } else {
        return res.status(401).send({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).send({
        success: false,
        message: 'Internal authentication error',
      });
    }
  }

  // Simple logout endpoint
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      res.clearCookie('auth-token');
      return res.status(200).send({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).send({
        success: false,
        message: 'Internal error during logout',
      });
    }
  }

  // Session check endpoint
  @Get('session')
  async session(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      const token = req.cookies['auth-token'];
      if (!token) {
        return res.status(401).send({
          success: false,
          message: 'No session found',
        });
      }

      const result = await this.authService.validateSession(token);
      if (result.valid) {
        return res.status(200).send({
          success: true,
          user: result.user,
        });
      } else {
        res.clearCookie('auth-token');
        return res.status(401).send({
          success: false,
          message: 'Invalid session',
        });
      }
    } catch (error) {
      console.error('Session check error:', error);
      return res.status(500).send({
        success: false,
        message: 'Internal error during session check',
      });
    }
  }
}
