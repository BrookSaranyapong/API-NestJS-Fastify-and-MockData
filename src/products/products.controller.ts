import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// ★ เพิ่มสองอันนี้
import { Auth } from '@/common/decorators/auth.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';

@Auth() // ต้องมี access token เสมอ
@UseGuards(RolesGuard) // เปิดตรวจ role
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // --- CRUD: admin เท่านั้น ---
  @Post()
  @Roles('admin')
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  // อ่าน: user หรือ admin
  @Get()
  @Roles('user', 'admin')
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q?: string,
  ) {
    return this.products.findAll(+page, +limit, q);
  }

  // อ่าน: user หรือ admin
  @Get(':id')
  @Roles('user', 'admin')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.products.findOne(id);
  }

  // --- CRUD: admin เท่านั้น ---
  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.products.remove(id);
  }

  // endpoint dev/seed/reset ก็ให้ admin เท่านั้น
  @Post('seed')
  @Roles('admin')
  seed(@Query('count') count = '20') {
    return this.products.seed(+count);
  }

  @Post('reset')
  @Roles('admin')
  reset() {
    return this.products.reset();
  }
}
