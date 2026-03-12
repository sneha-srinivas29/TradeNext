// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy, ExtractJwt } from 'passport-jwt';
// import type { Request } from 'express';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor() {
//     super({
//       jwtFromRequest: ExtractJwt.fromExtractors([
//         (req: Request) => req?.cookies?.accessToken,
//       ]),
//       ignoreExpiration: false,
//       secretOrKey: process.env.JWT_SECRET || 'secret',
//     });
//   }

//   async validate(payload: any) {
//     // attach minimal user info to request.user
//     return { userId: payload.sub, role: payload.role };
//   }
// }

// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import type { Request } from 'express';
// import { AuthService } from './auth.service';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
//   constructor(private readonly authService: AuthService) {
//     super({
//       // Read token from HttpOnly cookie — NOT the Authorization header
//       jwtFromRequest: ExtractJwt.fromExtractors([
//         (req: Request) => req?.cookies?.accessToken ?? null,
//       ]),
//       ignoreExpiration: false,
//       secretOrKey:      process.env.JWT_SECRET, // no fallback — fails loudly if unset
//     });
//   }

//   /**
//    * Called after JWT signature is verified.
//    * Fetches full user from DB so req.user always has the complete, up-to-date shape.
//    */
//   async validate(payload: { sub: string; role: string }) {
//     const user = await this.authService.findUserById(payload.sub);
//     if (!user) throw new UnauthorizedException('User not found or deactivated');
//     return user; // becomes req.user
//   }
// }


import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub:  string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService:  UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.accessToken ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      userId:              String(user._id),
      email:               user.email,
      role:                user.role,
      netsuiteCustomerId:  user.netsuiteCustomerId ?? null,
    };
  }
}