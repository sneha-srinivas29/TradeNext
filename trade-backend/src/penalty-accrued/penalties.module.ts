import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PenaltiesService } from './services/penalties.service';
import { BackdatedAdjustmentService } from './services/backdated-adjustment.service';
import { PenaltiesController } from './controllers/penalties.controller';
import { BackdatedAdjustmentController } from './controllers/backdated-adjustment.controller';
import { InvoicePenalty, InvoicePenaltySchema } from './schemas/invoice-penalty.schema';
import { NetsuiteModule } from '../netsuite/netsuite.module'; // ✅ Import

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InvoicePenalty.name, schema: InvoicePenaltySchema },
    ]),
    HttpModule, // ✅ Add if not present
    ConfigModule, // ✅ Add if not present
    NetsuiteModule,
  ],
  controllers: [PenaltiesController ,  BackdatedAdjustmentController,],
  providers: [PenaltiesService , BackdatedAdjustmentService, ],
  exports: [PenaltiesService , BackdatedAdjustmentService,],
})
export class PenaltyAccruedModule {}