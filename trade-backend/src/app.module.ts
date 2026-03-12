// import { Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { MongooseModule } from '@nestjs/mongoose';
// import configuration from './config/configuration';
// import { NetsuiteModule } from './netsuite/netsuite.module';
// import { AppController } from './app.controller';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';
// import { DashboardModule } from './dashboard/dashboard.module';
// import { PenaltyAccruedModule } from './penalty-accrued/penalties.module';
// import { OrderModule } from './order-service/order.module';
// import { UsersModule } from './users/users.module';
// import { AuthModule } from './auth/auth.module';
// import { SalesOrdersModule } from './sales-orders/sales-orders.module';
// import { TradeProxyController } from "./netsuite/controllers/trade-proxy.controller";
// import { NetsuiteProxyController } from "./netsuite/controllers/netsuite-proxy.controller";
// import { HttpModule } from '@nestjs/axios';

// @Module({
//   imports: [
//     HttpModule,
//     ServeStaticModule.forRoot({
//       rootPath: join(__dirname, '..', 'public'),
//       serveRoot: '/static',
//     }),
//     ConfigModule.forRoot({
//       isGlobal: true,
//       load: [configuration],
//       envFilePath: '.env',
//     }),
//     MongooseModule.forRootAsync({
//       inject: [ConfigService],
//       useFactory: (configService: ConfigService) => {
//         const uri = configService.get<string>('MONGODB_URI');
//         if (!uri) {
//           throw new Error('MONGODB_URI environment variable is required');
//         }
//         return {
//           uri,
//           connectionFactory: (connection) => {
//             connection.on('connected', () => {
//               console.log('MongoDB connected to tradetech database');
//             });
//             connection.on('error', (error) => {
//               console.error('MongoDB connection error:', error);
//             });
//             return connection;
//           },
//         };
//       },
//     }),
//     NetsuiteModule,
//     DashboardModule,
//     PenaltyAccruedModule,
//     OrderModule,
//     UsersModule,
//     AuthModule,
//     SalesOrdersModule,
//   ],
//   controllers: [AppController, TradeProxyController, NetsuiteProxyController],
// })
// export class AppModule {}

// import { Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { MongooseModule } from '@nestjs/mongoose';
// import configuration from './config/configuration';
// import { NetsuiteModule } from './netsuite/netsuite.module';
// import { AppController } from './app.controller';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';
// import { DashboardModule } from './dashboard/dashboard.module';
// import { PenaltyAccruedModule } from './penalty-accrued/penalties.module';
// import { OrderModule } from './order-service/order.module';
// import { UsersModule } from './users/users.module';
// import { AuthModule } from './auth/auth.module';
// import { SalesOrdersModule } from './sales-orders/sales-orders.module';

// // ❌ REMOVED: TradeProxyController and NetsuiteProxyController imports
// // They are already registered inside NetsuiteModule — importing them here
// // caused both routes to be mapped twice in the logs.

// @Module({
//   imports: [
//     ServeStaticModule.forRoot({
//       rootPath: join(__dirname, '..', 'public'),
//       serveRoot: '/static',
//     }),
//     ConfigModule.forRoot({
//       isGlobal: true,
//       load:     [configuration],
//       envFilePath: '.env',
//     }),
//     MongooseModule.forRootAsync({
//       inject:     [ConfigService],
//       useFactory: (configService: ConfigService) => {
//         const uri = configService.get<string>('MONGODB_URI');
//         if (!uri) throw new Error('MONGODB_URI environment variable is required');
//         return {
//           uri,
//           connectionFactory: (connection) => {
//             connection.on('connected', () =>
//               console.log('MongoDB connected to tradetech database'),
//             );
//             connection.on('error', (error) =>
//               console.error('MongoDB connection error:', error),
//             );
//             return connection;
//           },
//         };
//       },
//     }),
//     NetsuiteModule,       
//     DashboardModule,
//     PenaltyAccruedModule,
//     OrderModule,
//     UsersModule,
//     AuthModule,
//     SalesOrdersModule,
//   ],
//   controllers: [AppController], // ← only AppController here, nothing else
// })
// export class AppModule {}



import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule'; 
import { join } from 'path';

import configuration from './config/configuration';
import { AppController } from './app.controller';

import { NetsuiteModule } from './netsuite/netsuite.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PenaltyAccruedModule } from './penalty-accrued/penalties.module';
import { OrderModule } from './order-service/order.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SalesOrdersModule } from './sales-orders/sales-orders.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    ScheduleModule.forRoot(), // ✅ only here, not in NetsuiteModule

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error('MONGODB_URI environment variable is required');
        }
        return {
          uri,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              console.log('MongoDB connected to tradetech database');
            });
            connection.on('error', (error) => {
              console.error('MongoDB connection error:', error);
            });
            return connection;
          },
        };
      },
    }),

    NetsuiteModule,
    DashboardModule,
    PenaltyAccruedModule,
    OrderModule,
    UsersModule,
    AuthModule,
    SalesOrdersModule,
  ],

  controllers: [AppController],
})
export class AppModule {}