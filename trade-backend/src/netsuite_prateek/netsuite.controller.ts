// src/netsuite/netsuite.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  Logger, 
  HttpException, 
  HttpStatus,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { NetsuiteService } from './netsuite.service';
import { POCreationDto } from './dto/po-creation.dto';

@Controller('netsuite')
export class NetsuiteController {
  private readonly logger = new Logger(NetsuiteController.name);

  constructor(private readonly netsuiteService: NetsuiteService) {}

  @Post('po-verification')
  @UsePipes(new ValidationPipe({ transform: true }))
  async verifyAndCreatePO(@Body() payload: POCreationDto) {
    this.logger.log(`=== PO Verification Request ===`);
    this.logger.log(`SO: ${payload.salesOrderNumber} (ID: ${payload.salesOrderId})`);
    this.logger.log(`PO Exists: ${payload.poExists}`);
    
    try {
      const result = await this.netsuiteService.ensurePOCreation(payload);
      
      this.logger.log(`=== PO Verification Success ===`);
      this.logger.log(`Status: ${result.status}`);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        data: result
      };
    } catch (error) {
      this.logger.error(`=== PO Verification Failed ===`);
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(error.stack);
      
      throw new HttpException(
        {
          success: false,
          timestamp: new Date().toISOString(),
          message: error.message,
          salesOrderId: payload.salesOrderId,
          salesOrderNumber: payload.salesOrderNumber
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'NetSuite PO Creation Service'
    };
  }
}