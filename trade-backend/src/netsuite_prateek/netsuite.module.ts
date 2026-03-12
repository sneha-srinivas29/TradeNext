// src/netsuite/netsuite.module.ts
import { Module } from '@nestjs/common';
import { NetsuiteController } from './netsuite.controller';
import { NetsuiteService } from './netsuite.service';

@Module({
  controllers: [NetsuiteController],
  providers: [NetsuiteService],
  exports: [NetsuiteService]
})
export class NetsuiteModule {}