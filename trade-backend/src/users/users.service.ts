// import { Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import * as bcrypt from 'bcrypt';
// import { User } from './users.entity';

// @Injectable()
// export class UsersService {
//   private readonly logger = new Logger(UsersService.name);

//   constructor(@InjectModel(User.name) private userModel: Model<User>) {}

//   async create(userDto: any) {
//     const hashed = await bcrypt.hash(userDto.password, 10);
//     const created = new this.userModel({ ...userDto, password: hashed });
//     return created.save();
//   }

//   async update(id: string, patch: any) {
//     if (patch.password) {
//       patch.password = await bcrypt.hash(patch.password, 10);
//     }
//     return this.userModel.findByIdAndUpdate(id, patch, { new: true }).exec();
//   }

//   async deactivate(id: string) {
//     return this.userModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();
//   }

//   async findAll() {
//     return this.userModel.find().lean().exec();
//   }

//   async findByEmail(email: string) {
//     return this.userModel.findOne({ email }).exec();
//   }

//   async findById(id: string) {
//     return this.userModel.findById(id).exec();
//   }

//   async setRefreshToken(userId: string, refreshTokenHash: string, expiry: Date) {
//     return this.userModel.findByIdAndUpdate(userId, { refreshTokenHash, refreshTokenExpiry: expiry }, { new: true }).exec();
//   }

//   async clearRefreshToken(userId: string) {
//     return this.userModel.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: '', refreshTokenExpiry: '' } }, { new: true }).exec();
//   }
// }

// import {
//   Injectable,
//   ConflictException,
//   NotFoundException,
//   Logger,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import * as bcrypt from 'bcrypt';

// import { User, UserDocument } from './schemas/user.schemas';
// import { CreateUserDto } from './dto/create-users.dto';

// @Injectable()
// export class UsersService {
//   private readonly logger = new Logger(UsersService.name);

//   constructor(
//     @InjectModel(User.name)
//     private readonly userModel: Model<UserDocument>,
//   ) {}

//   // ─── CREATE ──────────────────────────────────────────────────────────────────


//   async create(createUserDto: CreateUserDto): Promise<UserDocument> {
//   console.log('🏗️ create() received:', JSON.stringify(createUserDto));

//     const existing = await this.userModel.findOne({
//       email: createUserDto.email.toLowerCase(),
//     });

//     if (existing) {
//       throw new ConflictException('User with this email already exists');
//     }

//     const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

//     // Derive username from email if not provided
//     // e.g. "buyer@goyalglobal.com" → "buyer_goyalglobal"
//     const emailLocal      = createUserDto.email.split('@')[0];
//     const emailDomain     = createUserDto.email.split('@')[1]?.split('.')[0] ?? '';
//     const derivedUsername = `${emailLocal}_${emailDomain}`.toLowerCase();

//     const created = new this.userModel({
//       ...createUserDto,
//       email:              createUserDto.email.toLowerCase(),
//       password:           hashedPassword,
//       isActive:           true,
//       // ✅ Satisfy DB schema required fields with safe defaults
//       username:           createUserDto.username           ?? derivedUsername,
//       role:               createUserDto.role               ?? 'BUYER',
//       roleName:           createUserDto.roleName           ?? 'BUYER',
//       netsuiteCustomerId: createUserDto.netsuiteCustomerId ?? null,
//     });

//     return created.save();
//   }

//   // ─── FINDERS ─────────────────────────────────────────────────────────────────

//   async findByEmail(email: string): Promise<UserDocument | null> {
//     return this.userModel.findOne({ email: email.toLowerCase() }).exec();
//   }

//   async findById(id: string): Promise<UserDocument | null> {
//     return this.userModel.findById(id).exec();
//   }

//   async findAll(): Promise<UserDocument[]> {
//     return this.userModel.find().lean().exec();
//   }

//   // ─── UPDATE ──────────────────────────────────────────────────────────────────

//   async update(userId: string, patch: Partial<UserDocument>) {
//     if (patch.password) {
//       patch.password = await bcrypt.hash(patch.password, 10);
//     }

//     const updated = await this.userModel
//       .findByIdAndUpdate(userId, patch, { new: true })
//       .exec();

//     if (!updated) throw new NotFoundException('User not found');

//     return updated;
//   }

//   async deactivate(userId: string) {
//     return this.userModel
//       .findByIdAndUpdate(userId, { isActive: false }, { new: true })
//       .exec();
//   }

//   // ─── AUTH HELPERS ─────────────────────────────────────────────────────────────

//   async validateUser(email: string, password: string): Promise<UserDocument | null> {
//     const user = await this.findByEmail(email);
//     if (!user || !user.isActive) return null;

//     const valid = await bcrypt.compare(password, user.password);
//     return valid ? user : null;
//   }

//   async updateLastLogin(userId: string): Promise<void> {
//     await this.userModel.findByIdAndUpdate(userId, {
//       lastLoginAt: new Date(),
//     });
//   }

//   // ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
//   // NOTE: auth.service already SHA-256 hashes the token before calling here

//   async setRefreshToken(userId: string, hash: string, expiry: Date): Promise<void> {
//     await this.userModel.findByIdAndUpdate(userId, {
//       refreshToken:       hash,
//       refreshTokenExpiry: expiry,
//     });
//   }

//   async clearRefreshToken(userId: string): Promise<void> {
//     await this.userModel.findByIdAndUpdate(userId, {
//       $unset: { refreshToken: '', refreshTokenExpiry: '' },
//     });
//   }

//   // ─── PROFILE ─────────────────────────────────────────────────────────────────

//   async getUserProfile(userId: string) {
//     const user = await this.userModel
//       .findById(userId)
//       .select('-password -refreshToken -refreshTokenExpiry')
//       .exec();

//     if (!user) throw new NotFoundException('User not found');

//     return user;
//   }
// }


import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './schemas/user.schemas';
import { CreateUserDto } from './dto/create-users.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ─────────────────────────────────────────────
  // CREATE USER
  // ─────────────────────────────────────────────

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    this.logger.log(`Creating user: ${createUserDto.email}`);

    const email = createUserDto.email.toLowerCase();

    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Derive username if not provided
    const emailLocal = email.split('@')[0];
    const emailDomain = email.split('@')[1]?.split('.')[0] ?? '';
    const derivedUsername = `${emailLocal}_${emailDomain}`.toLowerCase();

    const role = createUserDto.role ?? 'BUYER';

    // Role-based permission defaults
    const permissions =
      role === 'ADMIN'
        ? {
            canCreateSO: true,
            canEditSO: true,
            canViewSO: true,
            canCreatePO: true,
            canEditPO: true,
            canViewPO: true,
          }
        : {
            canCreateSO: false,
            canEditSO: false,
            canViewSO: true,
            canCreatePO: false,
            canEditPO: false,
            canViewPO: true,
          };

    const createdUser = new this.userModel({
      email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      username: createUserDto.username ?? derivedUsername,
      role,
      roleName: createUserDto.roleName ?? role,
      netsuiteCustomerId: createUserDto.netsuiteCustomerId ?? null,
      permissions,
      isActive: true,
      lastLoginAt: null,
      refreshToken: null,
      refreshTokenExpiry: null,
    });

    // 🔍 DEBUG — remove after fixing
    console.log('DTO value:', createUserDto.netsuiteCustomerId);
    console.log('Model value:', createdUser.netsuiteCustomerId);

    const saved = await createdUser.save();
    console.log('Saved value:', saved.netsuiteCustomerId);

    return saved;
  }

  // ─────────────────────────────────────────────
  // FINDERS
  // ─────────────────────────────────────────────

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().lean().exec();
  }

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────

  async update(userId: string, patch: Partial<UserDocument>) {
    if (patch.password) {
      patch.password = await bcrypt.hash(patch.password, 10);
    }

    const updated = await this.userModel
      .findByIdAndUpdate(userId, patch, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return updated;
  }

  async deactivate(userId: string) {
    const updated = await this.userModel
      .findByIdAndUpdate(userId, { isActive: false }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return updated;
  }

  // ─────────────────────────────────────────────
  // AUTH HELPERS
  // ─────────────────────────────────────────────

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.findByEmail(email);

    if (!user || !user.isActive) return null;

    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
    });
  }

  // ─────────────────────────────────────────────
  // REFRESH TOKEN MANAGEMENT
  // ─────────────────────────────────────────────

  async setRefreshToken(
    userId: string,
    hash: string,
    expiry: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hash,
      refreshTokenExpiry: expiry,
    });
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $unset: {
        refreshToken: '',
        refreshTokenExpiry: '',
      },
    });
  }

  // ─────────────────────────────────────────────
  // PROFILE
  // ─────────────────────────────────────────────

  async getUserProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -refreshToken -refreshTokenExpiry')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}