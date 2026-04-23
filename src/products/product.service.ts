import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ProductService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private products = [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Phone', price: 699 },
    { id: 3, name: 'Tablet', price: 499 },
  ];

  async findAll() {
    const cached = await this.cacheManager.get('products');
    if (cached) {
      console.log('Serving from cache');
      return cached;
    }

    console.log('Serving from data source');
    await this.cacheManager.set('products', this.products, 60000);
    return this.products;
  }

  async create(data: { name: string; price: number }) {
    const newProduct = {
      id: this.products.length + 1,
      ...data,
    };
    this.products.push(newProduct);
    await this.cacheManager.del('products');
    return newProduct;
  }
}
