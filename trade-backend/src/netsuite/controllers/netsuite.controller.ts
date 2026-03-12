import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { NetsuiteService } from '../services/netsuite.service';
import { JwtGuard } from '../../auth/jwt.guard'; // ✅ correct path per your folder structure

@Controller('netsuite')
export class NetsuiteController {
  constructor(private readonly netsuiteService: NetsuiteService) {}

  @Get('token')
  @UseGuards(JwtGuard)
  async getToken() {
    return this.netsuiteService.getNetsuiteToken();
  }

  @Post('token/refresh')
  @UseGuards(JwtGuard)
  async refreshToken() {
    await this.netsuiteService.invalidateToken();
    return this.netsuiteService.getNetsuiteToken();
  }
}
