import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Product } from './interfaces/product.interface';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private products: Product[] = [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Phone', price: 699 },
    { id: 3, name: 'Tablet', price: 499 },
  ];

  async findAll(): Promise<Product[]> {
    try {
      const cached = await this.cacheManager.get<Product[]>('products');
      if (cached) {
        this.logger.log('Serving from cache');
        return cached;
      }
    } catch (error) {
      this.logger.error('Error fetching from cache', error);
    }

    this.logger.log('Serving from data source');
    try {
      await this.cacheManager.set('products', this.products, 60000);
    } catch (error) {
      this.logger.error('Error saving to cache', error);
    }
    return this.products;
  }

  async create(data: CreateProductDto): Promise<Product> {
    const newProduct: Product = {
      id: this.products.length + 1,
      ...data,
    };
    this.products.push(newProduct);

    try {
      await this.cacheManager.del('products');
      this.logger.log('Cache invalidated');
    } catch (error) {
      this.logger.error('Error invalidating cache', error);
    }

    return newProduct;
  }
}
