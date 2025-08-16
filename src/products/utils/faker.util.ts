import { faker } from '@faker-js/faker';
import { CreateProductDto } from '../dto/create-product.dto';

export function makeFakeProduct(): CreateProductDto {
  return {
    name: faker.commerce.productName(),
    price: parseFloat(
      (faker.number.int({ min: 1000, max: 99999 }) / 100).toFixed(2),
    ),
    stock: faker.number.int({ min: 0, max: 200 }),
  };
}
