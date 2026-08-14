import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { Repository } from 'typeorm';
import { ApplicationConfiguration } from '../config/configuration';
import { Media } from './entities/media.entity';

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

interface CloudinaryPingResponse {
  status: string;
}

export interface CloudinaryUploadResponse {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  width: number | null;
  height: number | null;
  bytes: number;
  originalName: string | null;
  uploadedById: string | null;
  createdAt: Date;
}

export interface UploadImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
}

interface CloudinaryDestroyResponse {
  result: string;
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  return new Error('Error al subir la imagen a Cloudinary.');
}

@Injectable()
export class CloudinaryService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService<
      ApplicationConfiguration,
      true
    >,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  onModuleInit(): void {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow('cloudinary.cloudName', {
        infer: true,
      }),
      api_key: this.configService.getOrThrow('cloudinary.apiKey', {
        infer: true,
      }),
      api_secret: this.configService.getOrThrow('cloudinary.apiSecret', {
        infer: true,
      }),
      secure: true,
    });
  }

  async ping(): Promise<CloudinaryPingResponse> {
    const response = (await cloudinary.api.ping()) as CloudinaryPingResponse;
    return response;
  }

  async uploadImage(
    file: UploadImageFile,
    uploadedById?: string | null,
  ): Promise<CloudinaryUploadResponse> {
    this.validateImageFile(file);

    const uploadResult = await this.uploadBuffer(file.buffer);

    try {
      const media = this.mediaRepository.create({
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        format: uploadResult.format,
        resourceType: uploadResult.resource_type,
        width: uploadResult.width ?? null,
        height: uploadResult.height ?? null,
        bytes: uploadResult.bytes,
        originalName: file.originalname ?? null,
        uploadedById: uploadedById ?? null,
      });

      const savedMedia = await this.mediaRepository.save(media);

      return {
        id: savedMedia.id,
        publicId: savedMedia.publicId,
        url: savedMedia.url,
        secureUrl: savedMedia.secureUrl,
        format: savedMedia.format,
        resourceType: savedMedia.resourceType,
        width: savedMedia.width,
        height: savedMedia.height,
        bytes: savedMedia.bytes,
        originalName: savedMedia.originalName,
        uploadedById: savedMedia.uploadedById,
        createdAt: savedMedia.createdAt,
      };
    } catch (error) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
      throw error;
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!publicId?.trim()) {
      throw new BadRequestException('El publicId de la imagen es obligatorio.');
    }

    const media = await this.mediaRepository.findOne({
      where: { publicId },
    });

    if (!media) {
      throw new NotFoundException('La imagen no existe.');
    }

    const destroyResult = (await cloudinary.uploader.destroy(publicId, {
      resource_type: media.resourceType,
    })) as CloudinaryDestroyResponse;

    if (destroyResult.result === 'not found') {
      throw new NotFoundException('La imagen no existe en Cloudinary.');
    }

    await this.mediaRepository.softDelete(media.id);
  }

  private validateImageFile(file: UploadImageFile): void {
    if (!file?.buffer) {
      throw new BadRequestException('La imagen es obligatoria.');
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'El archivo debe ser una imagen JPG, PNG, WEBP o GIF.',
      );
    }

    const maxImageSizeBytes = this.configService.getOrThrow(
      'cloudinary.maxImageSizeBytes',
      { infer: true },
    );

    if (file.size > maxImageSizeBytes) {
      throw new BadRequestException(
        `La imagen no puede superar los ${Math.floor(
          maxImageSizeBytes / 1024 / 1024,
        )}MB.`,
      );
    }
  }

  private async uploadBuffer(buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'aislafriopro',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(toError(error));
            return;
          }

          if (!result) {
            reject(new Error('Cloudinary no devolvio informacion de subida.'));
            return;
          }

          resolve(result);
        },
      );

      uploadStream.end(buffer);
    });
  }
}
