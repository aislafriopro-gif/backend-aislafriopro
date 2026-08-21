import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, IsNull, Repository } from 'typeorm';
import {
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';
import { CloudinaryService } from '../media/cloudinary.service';
import { Media } from '../media/entities/media.entity';
import 'multer';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsAdminQueryDto } from './dto/find-products-admin-query.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { ProductPublicResponseDto } from './dto/product-public-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductImage } from './media/entities/product-image.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files?: Express.Multer.File[],
    uploadedById?: string | null,
  ): Promise<Product> {
    await this.ensureSlugAvailable(createProductDto.slug);

    const productData: Partial<Product> = {
      name: createProductDto.name,
      slug: createProductDto.slug,
      description: createProductDto.description,
      price: createProductDto.price,
    };

    const product = this.productRepository.create(productData);
    const savedProduct = await this.productRepository.save(product);

    if (files && files.length > 0) {
      for (const file of files) {
        this.validateImageFile(file);
      }

      await this.attachAndReorderUploadedImages(
        savedProduct.id,
        files,
        uploadedById,
      );
    }

    return this.productRepository.findOneOrFail({
      where: { id: savedProduct.id },
      relations: ['images', 'images.media'],
    });
  }

  async findAll(
    query: FindProductsQueryDto,
  ): Promise<PaginatedResponse<ProductPublicResponseDto>> {
    const where: FindOptionsWhere<Product> = {
      deletedAt: IsNull(),
      status: ProductStatus.ACTIVE,
      isPublished: true,
    };

    if (query.search) {
      where.name = ILike(`%${query.search}%`);
      where.description = ILike(`%${query.search}%`);
    }

    const [data, total] = await this.productRepository.findAndCount({
      where,
      relations: ['images', 'images.media'],
      order: { createdAt: 'DESC' },
      skip: query.offset,
      take: query.limit,
    });

    const mapped = data.map((product) => this.mapToPublicResponse(product));
    return buildPaginatedResponse(mapped, total, query.page, query.limit);
  }

  async findAllAdmin(
    query: FindProductsAdminQueryDto,
  ): Promise<PaginatedResponse<Product>> {
    const where: FindOptionsWhere<Product> = {};

    this.applyAdminFilters(where, query);

    if (query.productId) {
      where.id = query.productId;
    }

    const [data, total] = await this.productRepository.findAndCount({
      where,
      withDeleted: true,
      relations: ['images', 'images.media'],
      order: { createdAt: 'DESC' },
      skip: query.offset,
      take: query.limit,
    });

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async findOne(id: string): Promise<ProductPublicResponseDto> {
    const product = await this.productRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
        status: ProductStatus.ACTIVE,
        isPublished: true,
      },
      relations: ['images', 'images.media'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return this.mapToPublicResponse(product);
  }

  async findOneBySlug(slug: string): Promise<ProductPublicResponseDto> {
    const product = await this.productRepository.findOne({
      where: {
        slug,
        deletedAt: IsNull(),
        status: ProductStatus.ACTIVE,
        isPublished: true,
      },
      relations: ['images', 'images.media'],
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return this.mapToPublicResponse(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files?: Express.Multer.File[],
    uploadedById?: string | null,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    if (updateProductDto.slug !== undefined) {
      await this.ensureSlugAvailable(updateProductDto.slug, id);
    }

    const updateData: Partial<Product> = {};

    if (updateProductDto.name !== undefined) {
      updateData.name = updateProductDto.name;
    }

    if (updateProductDto.slug !== undefined) {
      updateData.slug = updateProductDto.slug;
    }

    if (updateProductDto.description !== undefined) {
      updateData.description = updateProductDto.description;
    }

    if (updateProductDto.price !== undefined) {
      updateData.price = updateProductDto.price;
    }

    Object.assign(product, updateData);
    const savedProduct = await this.productRepository.save(product);

    if (files && files.length > 0) {
      for (const file of files) {
        this.validateImageFile(file);
      }

      await this.attachAndReorderUploadedImages(
        savedProduct.id,
        files,
        uploadedById,
      );
    }

    return this.productRepository.findOneOrFail({
      where: { id: savedProduct.id },
      relations: ['images', 'images.media'],
    });
  }

  async publish(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    product.isPublished = !product.isPublished;
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    await this.productRepository.softDelete(id);
  }

  async restore(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    if (product.deletedAt === null || product.deletedAt === undefined) {
      throw new ConflictException(`Product with id "${id}" is not deleted`);
    }

    await this.ensureSlugAvailable(product.slug, id);

    product.deletedAt = null;
    return this.productRepository.save(product);
  }

  private applyAdminFilters(
    where: FindOptionsWhere<Product>,
    query: FindProductsAdminQueryDto,
  ): void {
    if (query.status) {
      where.status = query.status;
    }

    if (query.isPublished !== undefined) {
      where.isPublished = query.isPublished === 'true';
    }

    if (query.search) {
      where.name = ILike(`%${query.search}%`);
      where.description = ILike(`%${query.search}%`);
    }
  }

  private async attachAndReorderUploadedImages(
    productId: string,
    files: Express.Multer.File[],
    uploadedById?: string | null,
  ): Promise<void> {
    for (const file of files) {
      try {
        const uploadFile = {
          buffer: file.buffer,
          mimetype: file.mimetype,
          size: file.size,
          originalname: file.originalname,
        };

        const uploadResult = await this.cloudinaryService.uploadImage(
          uploadFile,
          uploadedById,
        );

        await this.associateProductImage(productId, uploadResult.id);
      } catch (error) {
        console.error(
          `Error uploading image for product ${productId}. El producto se guardó sin esta imagen.`,
          error,
        );
      }
    }
  }

  private async associateProductImage(
    productId: string,
    mediaId: string,
  ): Promise<void> {
    await this.productImageRepository.increment(
      { productId, isActive: true },
      'displayOrder',
      1,
    );

    const image = this.productImageRepository.create({
      productId,
      mediaId,
      displayOrder: 0,
      isActive: true,
    });

    await this.productImageRepository.save(image);
  }

  private validateImageFile(file: Express.Multer.File): void {
    const MAX_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = /^image\/(jpeg|png|webp|gif)$/;

    if (file.size > MAX_SIZE) {
      throw new BadRequestException(
        `El archivo "${file.originalname}" supera el tamaño máximo de 5 MB.`,
      );
    }

    if (!ALLOWED_TYPES.test(file.mimetype)) {
      throw new BadRequestException(
        `El archivo "${file.originalname}" tiene un tipo no permitido (${file.mimetype}). Se permiten: jpeg, png, webp, gif.`,
      );
    }
  }

  private async ensureSlugAvailable(
    slug: string,
    excludedId?: string,
  ): Promise<void> {
    const existing = await this.productRepository.findOne({
      where: { slug, deletedAt: IsNull() },
    });

    if (existing && existing.id !== excludedId) {
      throw new ConflictException(`Product slug "${slug}" is already in use`);
    }
  }

  private mapToPublicResponse(product: Product): ProductPublicResponseDto {
    const activeImages = (product.images ?? [])
      .filter((image) => image.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((image) => image.media)
      .filter((media): media is Media => media !== null);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      images: activeImages,
    };
  }
}
