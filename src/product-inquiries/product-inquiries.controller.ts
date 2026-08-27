import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CreateProductInquiryDto } from './dto/create-product-inquiry.dto';
import { ProductInquiryResponseDto } from './dto/product-inquiry-response.dto';
import { ProductInquiriesService } from './product-inquiries.service';

@ApiTags('Product Inquiries')
@Controller('product-inquiries')
export class ProductInquiriesController {
  constructor(
    private readonly productInquiriesService: ProductInquiriesService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una consulta pública de interés por un producto',
  })
  @ApiBody({ type: CreateProductInquiryDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Consulta de producto creada correctamente.',
    type: ProductInquiryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos o productId no válido.',
  })
  async create(
    @Body() createProductInquiryDto: CreateProductInquiryDto,
  ): Promise<ProductInquiryResponseDto> {
    const productInquiry = await this.productInquiriesService.create(
      createProductInquiryDto,
    );

    return {
      id: productInquiry.id,
      productId: productInquiry.productId,
      createdAt: productInquiry.createdAt,
      message: 'Consulta de producto creada correctamente.',
    };
  }
}
