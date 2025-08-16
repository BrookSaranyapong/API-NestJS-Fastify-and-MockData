import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { FileProductsRepository } from './file-products.repository';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, FileProductsRepository],
})
export class ProductsModule {}
