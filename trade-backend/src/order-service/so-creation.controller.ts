import { Controller, Post, Body, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { SOCreationService } from './so-creation.service';
import { SOCreationDto } from './schemas/so-creation.dto';

@Controller('netsuite')
export class SOCreationController {
  private readonly logger = new Logger(SOCreationController.name);

  constructor(private readonly soCreationService: SOCreationService) {}

  /**
   * This is the NEW URL you give to the API gateway.
   * It replaces the direct NetSuite SO URL.
   * Endpoint: POST /api/netsuite/so-creation
   */
  @Post('so-creation')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false })) // whitelist: false = pass unknown fields through
  async createSO(@Body() payload: SOCreationDto) {
    this.logger.log(`=== Incoming SO Creation Request ===`);
    return await this.soCreationService.createSO(payload);
  }
}