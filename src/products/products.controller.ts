import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginatedResponse } from '../common/pagination';
import { RoleName } from '../roles/entities/roles.entity';
import 'multer';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsAdminQueryDto } from './dto/find-products-admin-query.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { ProductPublicResponseDto } from './dto/product-public-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Auth(RoleName.ADMIN)
  @UseInterceptors(FilesInterceptor('imageFiles', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Crear un producto con imágenes opcionales (ADMIN)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        slug: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number', example: 1250.5 },
        imageFiles: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          nullable: true,
          default: [],
        },
      },
      required: ['name', 'slug', 'description', 'price'],
    },
  })
  @ApiResponse({ status: 201, description: 'Producto creado', type: Product })
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('id') userId: string | undefined,
  ): Promise<Product> {
    return this.productsService.create(createProductDto, files, userId);
  }

  @Get('all')
  @Auth(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Listar todos los productos incluyendo eliminados (ADMIN)',
  })
  async findAllAdmin(
    @Query() query: FindProductsAdminQueryDto,
  ): Promise<PaginatedResponse<Product>> {
    return this.productsService.findAllAdmin(query);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar productos publicados en la tienda' })
  @ApiResponse({
    status: 200,
    description: 'Listado de productos publicados',
    type: ProductPublicResponseDto,
    isArray: true,
  })
  async findAll(
    @Query() query: FindProductsQueryDto,
  ): Promise<PaginatedResponse<ProductPublicResponseDto>> {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('by-slug/:slug')
  @ApiOperation({
    summary: 'Obtener detalle de un producto publicado por slug',
  })
  @ApiParam({ name: 'slug', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    type: ProductPublicResponseDto,
  })
  async findOneBySlug(
    @Param('slug') slug: string,
  ): Promise<ProductPublicResponseDto> {
    return this.productsService.findOneBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un producto publicado',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    type: ProductPublicResponseDto,
  })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ProductPublicResponseDto> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Auth(RoleName.ADMIN)
  @UseInterceptors(FilesInterceptor('imageFiles', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Editar un producto (sin modificar status ni publicación) e incorporar nuevas imágenes (ADMIN). Los campos enviados vacíos se ignoran. Se requiere al menos 1 campo con valor o nuevas imágenes.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', nullable: true },
        slug: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        price: { type: 'number', example: 1250.5, nullable: true },
        imageFiles: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          nullable: true,
          default: [],
        },
      },
      required: [],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado',
    type: Product,
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('id') userId: string | undefined,
  ): Promise<Product> {
    return this.productsService.update(id, updateProductDto, files, userId);
  }

  @Patch(':id/publish')
  @Auth(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Publicar o despublicar un producto en la tienda (ADMIN)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Estado de publicación actualizado',
    type: Product,
  })
  async publish(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Product> {
    return this.productsService.publish(id);
  }

  @Delete(':id')
  @Auth(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar (soft delete) un producto (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.productsService.remove(id);
  }

  @Post(':id/restore')
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Restaurar un producto eliminado (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Producto restaurado',
    type: Product,
  })
  async restore(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Product> {
    return this.productsService.restore(id);
  }
}
