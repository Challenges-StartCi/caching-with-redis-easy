import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';

describe('ProductService', () => {
  let service: ProductService;
  let cacheManager: any;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return cached products if available', async () => {
      const cachedProducts = [{ id: 1, name: 'Cached Laptop', price: 900 }];
      cacheManager.get.mockResolvedValue(cachedProducts);

      const result = await service.findAll();

      expect(result).toEqual(cachedProducts);
      expect(cacheManager.get).toHaveBeenCalledWith('products');
      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('should fetch from data source and cache if not in cache', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect(cacheManager.get).toHaveBeenCalledWith('products');
      expect(cacheManager.set).toHaveBeenCalledWith('products', expect.any(Array), 60000);
    });

    it('should fetch from data source if cache manager throws error', async () => {
      cacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect(cacheManager.get).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new product and invalidate cache', async () => {
      const dto = { name: 'New Item', price: 100 };
      const result = await service.create(dto);

      expect(result).toMatchObject(dto);
      expect(result.id).toBeDefined();
      expect(cacheManager.del).toHaveBeenCalledWith('products');
    });

    it('should create a product even if cache invalidation fails', async () => {
      cacheManager.del.mockRejectedValue(new Error('Cache del error'));
      const dto = { name: 'New Item', price: 100 };
      const result = await service.create(dto);

      expect(result).toMatchObject(dto);
      expect(cacheManager.del).toHaveBeenCalled();
    });
  });
});
