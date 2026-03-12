

import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  Res,
  Req,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/auth.dto';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService:  JwtService,
  ) {}

  // ─── Shared cookie config ─────────────────────────────────────────────────────

  private cookieOptions(maxAge: number) {
    return {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path:     '/',
      maxAge,
    };
  }

  // ─── POST /auth/register ──────────────────────────────────────────────────────

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(registerDto);

    res.cookie('accessToken',  accessToken,  this.cookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, this.cookieOptions(7 * 24 * 60 * 60 * 1000));
    console.log("userrrr:",user);
    return { user };
  }

  // ─── POST /auth/login ─────────────────────────────────────────────────────────

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const { accessToken, refreshToken, user: u } = await this.authService.login(user);

    res.cookie('accessToken',  accessToken,  this.cookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, this.cookieOptions(7 * 24 * 60 * 60 * 1000));

    return { user: u };
  }

  // ─── GET /auth/me ─────────────────────────────────────────────────────────────

  @Get('me')
  async me(
    @Req()  req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = req.cookies ?? {};

    // 1. Verify access token
    if (accessToken) {
      try {
        const payload = this.jwtService.verify(accessToken) as { sub: string };
        const user    = await this.authService.findUserById(payload.sub);
        if (user) return user;
      } catch {
        // Expired — fall through to silent refresh
      }
    }

    // 2. Silent refresh
    if (refreshToken) {
      try {
        const result = await this.authService.refresh(refreshToken);
        if (!result) throw new UnauthorizedException('Session expired');

        res.cookie('accessToken', result.accessToken, this.cookieOptions(15 * 60 * 1000));
        return result.user;
      } catch {
        res.clearCookie('accessToken',  { path: '/' });
        res.clearCookie('refreshToken', { path: '/' });
        throw new UnauthorizedException('Session expired. Please log in again.');
      }
    }

    // 3. No cookies
    throw new UnauthorizedException('Not authenticated');
  }

  // ─── POST /auth/refresh ───────────────────────────────────────────────────────

  @Post('refresh')
  async refresh(
    @Req()  req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken } = req.cookies ?? {};
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

    const result = await this.authService.refresh(refreshToken);
    if (!result) throw new UnauthorizedException('Invalid or expired refresh token');

    res.cookie('accessToken', result.accessToken, this.cookieOptions(15 * 60 * 1000));
    return { user: result.user };
  }

  // ─── POST /auth/logout ────────────────────────────────────────────────────────

  @Post('logout')
  async logout(
    @Req()  req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken } = req.cookies ?? {};

    if (refreshToken) {
      try {
        const payload = this.jwtService.verify(refreshToken) as { sub: string };
        await this.authService.logout(payload.sub);
      } catch {
        // Invalid/expired — still clear cookies
      }
    }

    res.clearCookie('accessToken',  { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    return { success: true };
  }
}