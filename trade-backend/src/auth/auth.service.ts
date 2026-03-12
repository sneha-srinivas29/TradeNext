// // import { Injectable, UnauthorizedException } from '@nestjs/common';
// // import { UsersService } from '../users/users.service';
// // import * as bcrypt from 'bcrypt';
// // import { JwtService } from '@nestjs/jwt';
// // import * as crypto from 'crypto';
// // import { Logger } from '@nestjs/common';

// // @Injectable()
// // export class AuthService {
// //   private readonly logger = new Logger(AuthService.name);
// //   constructor(private usersService: UsersService, private jwtService: JwtService) {}

// //   async validateUser(email: string, pass: string) {
// //     const user = await this.usersService.findByEmail(email);
// //     if (!user || !user.isActive) return null;
// //     const match = await bcrypt.compare(pass, user.password);
// //     if (match) {
// //       const { password, ...rest } = user.toObject();
// //       return rest;
// //     }
// //     return null;
// //   }

// //   private signAccessToken(user: any) {
// //     const payload = { sub: user._id, role: user.role };
// //     return this.jwtService.sign(payload, { expiresIn: '15m' });
// //   }

// //   private signRefreshToken(user: any) {
// //     const payload = { sub: user._id, role: user.role };
// //     return this.jwtService.sign(payload, { expiresIn: '7d' });
// //   }

// //   async login(user: any) {
// //     const accessToken = this.signAccessToken(user);
// //     const refreshToken = this.signRefreshToken(user);

// //     // store hashed refresh token in DB
// //     const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
// //     const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
// //     await this.usersService.setRefreshToken(user._id, hash, expiry);

// //     return {
// //       accessToken,
// //       refreshToken,
// //       user: {
// //         id: user._id,
// //         firstName: user.firstName,
// //         lastName: user.lastName,
// //         email: user.email,
// //         role: user.role,
// //       },
// //     };
// //   }

// //   async refresh(refreshToken: string) {
// //     try {
// //       const payload: any = this.jwtService.verify(refreshToken);
// //       const user = await this.usersService.findById(payload.sub);
// //       if (!user) return null;

// //       const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
// //       if (!user.refreshTokenHash || user.refreshTokenHash !== hash) return null;

// //       // issue new access token
// //       const accessToken = this.jwtService.sign({ sub: user._id, role: user.role }, { expiresIn: '15m' });
// //       return { accessToken, user: { id: user._id, email: user.email, role: user.role } };
// //     } catch (err) {
// //       this.logger.error('Refresh token invalid', err);
// //       return null;
// //     }
// //   }

// //   async logout(userId: string) {
// //     await this.usersService.clearRefreshToken(userId);
// //     return true;
// //   }
// // }


// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { UsersService } from '../users/users.service';
// import * as bcrypt from 'bcrypt';
// import { JwtService } from '@nestjs/jwt';
// import * as crypto from 'crypto';
// import { Logger } from '@nestjs/common';

// @Injectable()
// export class AuthService {
//   private readonly logger = new Logger(AuthService.name);

//   constructor(
//     private usersService: UsersService,
//     private jwtService: JwtService,
//   ) {}

//   // ─── Validate ─────────────────────────────────────────────────────────────

//   async validateUser(email: string, pass: string) {
//     const user = await this.usersService.findByEmail(email);
//     if (!user || !user.isActive) return null;

//     const match = await bcrypt.compare(pass, user.password);
//     if (!match) return null;

//     const { password, ...rest } = user.toObject();
//     return rest;
//   }

//   // ─── Token Helpers ────────────────────────────────────────────────────────

//   private signAccessToken(user: any): string {
//     return this.jwtService.sign(
//       { sub: user._id, role: user.role },
//       { expiresIn: '15m' },
//     );
//   }

//   private signRefreshToken(user: any): string {
//     return this.jwtService.sign(
//       { sub: user._id, role: user.role },
//       { expiresIn: '7d' },
//     );
//   }

//   /** Consistent user shape returned to the frontend */
//   private formatUser(user: any) {
//     return {
//       userId:            String(user._id),
//       name:              `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
//       email:             user.email,
//       role:              user.role,
//       roleName:          user.roleName  ?? user.role,
//       companyInternalId: user.companyInternalId ?? user.companyId ?? '',
//       permissions: {
//         canCreateSO: user.permissions?.canCreateSO ?? false,
//         canEditSO:   user.permissions?.canEditSO   ?? false,
//         canViewSO:   user.permissions?.canViewSO   ?? false,
//         canCreatePO: user.permissions?.canCreatePO ?? false,
//         canEditPO:   user.permissions?.canEditPO   ?? false,
//         canViewPO:   user.permissions?.canViewPO   ?? false,
//       },
//     };
//   }

//   // ─── Login ────────────────────────────────────────────────────────────────

//   async login(user: any) {
//     const accessToken  = this.signAccessToken(user);
//     const refreshToken = this.signRefreshToken(user);

//     // Store hashed refresh token in DB
//     const hash   = crypto.createHash('sha256').update(refreshToken).digest('hex');
//     const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
//     await this.usersService.setRefreshToken(user._id, hash, expiry);

//     return {
//       accessToken,
//       refreshToken,
//       user: this.formatUser(user),
//     };
//   }

//   // ─── Find User by ID (used by GET /auth/me) ───────────────────────────────

//   async findUserById(id: string) {
//     try {
//       const user = await this.usersService.findById(id);
//       if (!user || !user.isActive) return null;
//       return this.formatUser(user);
//     } catch {
//       return null;
//     }
//   }

//   // ─── Refresh ──────────────────────────────────────────────────────────────

//   async refresh(refreshToken: string) {
//     try {
//       const payload: any = this.jwtService.verify(refreshToken);
//       const user         = await this.usersService.findById(payload.sub);
//       if (!user) return null;

//       // Check expiry in DB (server-side session expiry)
//       if (!user.refreshTokenExpiry || new Date(user.refreshTokenExpiry).getTime() < Date.now()) {
//         // Session expired
//         await this.usersService.clearRefreshToken(user._id.toString());
//         return null;
//       }

//       const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
//       if (!user.refreshTokenHash || user.refreshTokenHash !== hash) return null;

//       const accessToken = this.signAccessToken(user);
//       return {
//         accessToken,
//         user: this.formatUser(user),
//       };
//     } catch (err) {
//       this.logger.error('Refresh token invalid', err);
//       return null;
//     }
//   }

//   // ─── Logout ───────────────────────────────────────────────────────────────

//   async logout(userId: string) {
//     await this.usersService.clearRefreshToken(userId);
//     return true;
//   }
// }

// import { Injectable, Logger } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { UsersService } from '../users/users.service';
// import * as bcrypt from 'bcrypt';
// import * as crypto from 'crypto';

// @Injectable()
// export class AuthService {
//   private readonly logger = new Logger(AuthService.name);

//   constructor(
//     private readonly usersService: UsersService,
//     private readonly jwtService:   JwtService,
//   ) {}

//   // ─── Validate credentials ─────────────────────────────────────────────────

//   async validateUser(email: string, pass: string) {
//     const user = await this.usersService.findByEmail(email);
//     if (!user || !user.isActive) return null;

//     const match = await bcrypt.compare(pass, user.password);
//     if (!match) return null;

//     const { password, ...rest } = user.toObject();
//     return rest;
//   }

//   // ─── Token helpers ────────────────────────────────────────────────────────

//   private signAccessToken(user: any): string {
//     return this.jwtService.sign(
//       { sub: user._id, role: user.role },
//       { expiresIn: '15m' },
//     );
//   }

//   private signRefreshToken(user: any): string {
//     return this.jwtService.sign(
//       { sub: user._id, role: user.role },
//       { expiresIn: '7d' },
//     );
//   }

//   /** Consistent user shape returned to the frontend */
//   private formatUser(user: any) {
//     return {
//       userId:            String(user._id),
//       name:              `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
//       email:             user.email,
//       role:              user.role,
//       roleName:          user.roleName ?? user.role,
//       companyInternalId: user.companyInternalId ?? user.companyId ?? '',
//       permissions: {
//         canCreateSO: user.permissions?.canCreateSO ?? false,
//         canEditSO:   user.permissions?.canEditSO   ?? false,
//         canViewSO:   user.permissions?.canViewSO   ?? false,
//         canCreatePO: user.permissions?.canCreatePO ?? false,
//         canEditPO:   user.permissions?.canEditPO   ?? false,
//         canViewPO:   user.permissions?.canViewPO   ?? false,
//       },
//     };
//   }

//   // ─── Login ────────────────────────────────────────────────────────────────

//   async login(user: any) {
//     const accessToken  = this.signAccessToken(user);
//     const refreshToken = this.signRefreshToken(user);

//     // Store hashed refresh token in DB for server-side revocation
//     const hash   = crypto.createHash('sha256').update(refreshToken).digest('hex');
//     const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
//     await this.usersService.setRefreshToken(user._id, hash, expiry);

//     return { accessToken, refreshToken, user: this.formatUser(user) };
//   }

//   // ─── Find user by ID ──────────────────────────────────────────────────────

//   async findUserById(id: string) {
//     try {
//       const user = await this.usersService.findById(id);
//       if (!user || !user.isActive) return null;
//       return this.formatUser(user);
//     } catch {
//       return null;
//     }
//   }

//   // ─── Refresh ──────────────────────────────────────────────────────────────

//   async refresh(refreshToken: string) {
//     try {
//       const payload: any = this.jwtService.verify(refreshToken);
//       const user         = await this.usersService.findById(payload.sub);
//       if (!user) return null;

//       // Check server-side session expiry
//       if (
//         !user.refreshTokenExpiry ||
//         new Date(user.refreshTokenExpiry).getTime() < Date.now()
//       ) {
//         await this.usersService.clearRefreshToken(user._id.toString());
//         return null;
//       }

//       // Validate hash to prevent token reuse after logout
//       const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
//       if (!user.refreshTokenHash || user.refreshTokenHash !== hash) return null;

//       return {
//         accessToken: this.signAccessToken(user),
//         user:        this.formatUser(user),
//       };
//     } catch (err) {
//       this.logger.error('Refresh token invalid', err);
//       return null;
//     }
//   }

//   // ─── Logout ───────────────────────────────────────────────────────────────

//   async logout(userId: string) {
//     await this.usersService.clearRefreshToken(userId);
//     return true;
//   }
// }

import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService:   UsersService,
    private readonly jwtService:     JwtService,
    private readonly configService:  ConfigService,
  ) {}

  // ─── VALIDATE USER ────────────────────────────────────────────────────────────

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) return null;

    const match = await bcrypt.compare(pass, user.password);
    if (!match) return null;

    const { password, ...rest } = user.toObject();
    return rest;
  }

  // ─── TOKEN HELPERS ────────────────────────────────────────────────────────────

  private signAccessToken(user: any): string {
    const payload: JwtPayload = { sub: String(user._id), role: user.role };
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  private signRefreshToken(user: any): string {
    const payload: JwtPayload = { sub: String(user._id), role: user.role };
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  // ─── FORMAT USER — single source of truth for all auth responses ──────────────

  private formatUser(user: any) {
    return {
      userId:             String(user._id),
      name:               `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      email:              user.email,
      role:               user.role,
      roleName:           user.roleName          ?? user.role,
      companyInternalId:  user.companyInternalId ?? user.companyId ?? '',
      netsuiteCustomerId: user.netsuiteCustomerId ?? null,
      permissions: {
        canCreateSO: user.permissions?.canCreateSO ?? false,
        canEditSO:   user.permissions?.canEditSO   ?? false,
        canViewSO:   user.permissions?.canViewSO   ?? false,
        canCreatePO: user.permissions?.canCreatePO ?? false,
        canEditPO:   user.permissions?.canEditPO   ?? false,
        canViewPO:   user.permissions?.canViewPO   ?? false,
      },
    };
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────────

  async login(user: any) {
    const accessToken  = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);

    const hash   = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.usersService.setRefreshToken(String(user._id), hash, expiry);
    await this.usersService.updateLastLogin(String(user._id));

    return { accessToken, refreshToken, user: this.formatUser(user) };
  }

  // ─── REGISTER ─────────────────────────────────────────────────────────────────

async register(registerDto: RegisterDto) {
  try {
    console.log('📦 registerDto received:', JSON.stringify(registerDto)); // ← add this
    const user = await this.usersService.create({
        email:              registerDto.email,
        password:           registerDto.password,
        firstName:          registerDto.firstName,
        lastName:           registerDto.lastName,
        username:           registerDto.username,
        role:               registerDto.role,
        roleName:           registerDto.roleName,
        netsuiteCustomerId: registerDto.netsuiteCustomerId,
      });
      console.log("dto userr:",user);
      const accessToken  = this.signAccessToken(user);
      const refreshToken = this.signRefreshToken(user);

      const hash   = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.usersService.setRefreshToken(String(user._id), hash, expiry);

      return { accessToken, refreshToken, user: this.formatUser(user) };
    } catch (error: any) {
      throw new BadRequestException(error?.message || 'Registration failed');
    }
  }

  // ─── REFRESH TOKEN ────────────────────────────────────────────────────────────

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);
      const user    = await this.usersService.findById(payload.sub);

      if (!user) return null;

      if (
        !user.refreshTokenExpiry ||
        new Date(user.refreshTokenExpiry).getTime() < Date.now()
      ) {
        await this.usersService.clearRefreshToken(String(user._id));
        return null;
      }

      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      if (user.refreshToken !== hash) {
        await this.usersService.clearRefreshToken(String(user._id));
        return null;
      }

      return {
        accessToken: this.signAccessToken(user),
        user:        this.formatUser(user),
      };
    } catch (err) {
      this.logger.error('Refresh token invalid', err);
      return null;
    }
  }

  // ─── LOGOUT ───────────────────────────────────────────────────────────────────

  async logout(userId: string) {
    await this.usersService.clearRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }

  // ─── FIND USER BY ID (used by AuthController /me) ────────────────────────────

  async findUserById(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) return null;
    return this.formatUser(user);
  }

  // ─── MANUAL TOKEN VALIDATION ──────────────────────────────────────────────────
  

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}