import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { CreateProductInquiryDto } from './dto/create-product-inquiry.dto';
import { ProductInquiry } from './entities/product-inquiry.entity';

@Injectable()
export class ProductInquiriesService {
  constructor(
    @InjectRepository(ProductInquiry)
    private readonly productInquiryRepository: Repository<ProductInquiry>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(
    createProductInquiryDto: CreateProductInquiryDto,
  ): Promise<ProductInquiry> {
    const product = await this.productRepository.findOne({
      where: {
        id: createProductInquiryDto.productId,
        deletedAt: IsNull(),
      },
    });

    if (!product) {
      throw new BadRequestException(
        'El producto indicado en productId no existe o no está disponible.',
      );
    }

    const productInquiry = this.productInquiryRepository.create({
      name: createProductInquiryDto.name.trim(),
      email: createProductInquiryDto.email.trim(),
      phone: createProductInquiryDto.phone.trim(),
      productId: createProductInquiryDto.productId,
      product,
      message: createProductInquiryDto.message.trim(),
    });

    return this.productInquiryRepository.save(productInquiry);
  }
}
