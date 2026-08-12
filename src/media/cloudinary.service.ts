import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { ApplicationConfiguration } from '../config/configuration';

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
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface UploadImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
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

  async uploadImage(file: UploadImageFile): Promise<CloudinaryUploadResponse> {
    this.validateImageFile(file);

    const uploadResult = await this.uploadBuffer(file.buffer);

    return {
      publicId: uploadResult.public_id,
      url: uploadResult.url,
      secureUrl: uploadResult.secure_url,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
    };
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
