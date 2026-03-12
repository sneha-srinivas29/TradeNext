import { Injectable } from '@nestjs/common';

@Injectable()
export class SalesOrdersService {
  private store = [] as any[];

  findAll() {
    return this.store;
  }

  create(payload: any) {
    const rec = { id: String(this.store.length + 1), ...payload };
    this.store.push(rec);
    return rec;
  }

  update(id: string, payload: any) {
    const idx = this.store.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.store[idx] = { ...this.store[idx], ...payload };
    return this.store[idx];
  }
}
