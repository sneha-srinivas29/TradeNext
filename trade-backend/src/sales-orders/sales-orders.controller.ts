import { Controller, Get, Post, Body, Put, Param, UseGuards } from '@nestjs/common';
import { SalesOrdersService } from './sales-orders.service';
import { JwtGuard } from '../auth/jwt.guard';
import { AccessGuard } from '../access-control/access.guard';
import { CheckAccess } from '../access-control/access.decorator';

@Controller('sales-orders')
@UseGuards(JwtGuard, AccessGuard)
export class SalesOrdersController {
  constructor(private svc: SalesOrdersService) {}

  @Get()
  @CheckAccess('SALES_ORDER', 'VIEW')
  findAll() {
    return this.svc.findAll();
  }

  @Post()
  @CheckAccess('SALES_ORDER', 'CREATE')
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Put(':id')
  @CheckAccess('SALES_ORDER', 'EDIT')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }
}