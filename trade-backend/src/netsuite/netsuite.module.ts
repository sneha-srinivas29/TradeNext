import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { NetsuiteService } from './services/netsuite.service';
import { NetsuiteController } from './controllers/netsuite.controller';
import { NetsuiteProxyController } from './controllers/netsuite-proxy.controller';
import { TradeProxyController } from './controllers/trade-proxy.controller';

@Module({
  imports: [
    HttpModule.register({ timeout: 120000 }),
    ConfigModule,
    // ✅ ScheduleModule removed — registered once in AppModule
  ],
  controllers: [
    NetsuiteController,
    NetsuiteProxyController,
    TradeProxyController,
  ],
  providers: [NetsuiteService],
  exports:   [NetsuiteService],
})
export class NetsuiteModule {}

// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { NetsuiteController } from './controllers/netsuite.controller';
// import { NetsuiteService } from './services/netsuite.service';
// import { PurchaseOrder, PurchaseOrderSchema } from '../order-service/schemas/purchase-order.schema';
// import { PurchaseOrderService } from '../order-service/services/purchase-order.service';

// @Module({
//   imports: [
//     MongooseModule.forFeature([{ name: PurchaseOrder.name, schema: PurchaseOrderSchema }]),
//   ],
//   controllers: [NetsuiteController],
//   providers: [NetsuiteService, PurchaseOrderService],
//   exports: [NetsuiteService],
// })
// export class NetsuiteModule {}