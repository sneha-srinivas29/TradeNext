// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { PenaltyController } from './controllers/penalty.controller';
// import { PenaltyService } from './services/penalty.service';
// import { Penalty, PenaltySchema } from './schemas/penalty.schema';
// import { NetsuiteModule } from '../netsuite/netsuite.module';

// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       { name: Penalty.name, schema: PenaltySchema },
//     ]),
//     NetsuiteModule,
//   ],
//   controllers: [PenaltyController],
//   providers: [PenaltyService],
//   exports: [PenaltyService],
// })
// export class PenaltyModule {}