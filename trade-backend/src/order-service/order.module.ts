import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SOCreationController } from './so-creation.controller';
import { SOCreationService } from './so-creation.service';
import { POCreation, POCreationSchema } from './schemas/po-creation.schema';
import { SOCreation, SOCreationSchema } from './schemas/so-creation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: POCreation.name, schema: POCreationSchema },{ name: SOCreation.name, schema: SOCreationSchema },]),
  ],
  controllers: [OrderController, SOCreationController],
  providers: [OrderService, SOCreationService,],
  exports: [OrderService , SOCreationService]
})
export class OrderModule {}
