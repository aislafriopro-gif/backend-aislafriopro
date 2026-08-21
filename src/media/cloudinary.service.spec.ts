import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { Repository } from 'typeorm';
import { ApplicationConfiguration } from '../config/configuration';
import { Media } from './entities/media.entity';
import { CloudinaryService, UploadImageFile } from './cloudinary.service';

jest.mock('cloudinary', () => {
  const uploadStreamMock = jest.fn();
  const destroyMock = jest.fn();
  const pingMock = jest.fn();

  return {
    v2: {
      config: jest.fn(),
      api: {
        ping: pingMock,
      },
      uploader: {
        upload_stream: uploadStreamMock,
        destroy: destroyMock,
      },
    },
  };
});

const buildFile = (
  overrides: Partial<UploadImageFile> = {},
): UploadImageFile => ({
  buffer: Buffer.from('fake-image-content'),
  mimetype: 'image/jpeg',
  size: 1024,
  originalname: 'test.jpg',
  ...overrides,
});

const buildUploadResponse = (
  overrides: Partial<UploadApiResponse> = {},
): UploadApiResponse =>
  ({
    public_id: 'aislafriopro/test-image',
    url: 'http://res.cloudinary.com/test/image/upload/test-image.jpg',
    secure_url: 'https://res.cloudinary.com/test/image/upload/test-image.jpg',
    format: 'jpg',
    resource_type: 'image',
    width: 1920,
    height: 1080,
    bytes: 245000,
    ...overrides,
  }) as UploadApiResponse;

const buildMedia = (overrides: Partial<Media> = {}): Media => ({
  id: 'media-id',
  publicId: 'aislafriopro/test-image',
  url: 'http://res.cloudinary.com/test/image/upload/test-image.jpg',
  secureUrl: 'https://res.cloudinary.com/test/image/upload/test-image.jpg',
  format: 'jpg',
  resourceType: 'image',
  width: 1920,
  height: 1080,
  bytes: 245000,
  originalName: 'test.jpg',
  uploadedById: null,
  uploadedBy: null,
  createdAt: new Date('2026-08-14T12:00:00.000Z'),
  updatedAt: new Date('2026-08-14T12:00:00.000Z'),
  deletedAt: null,
  ...overrides,
});

describe('CloudinaryService', () => {
  let cloudinaryService: CloudinaryService;
  let configService: {
    getOrThrow: jest.Mock<string | number, [string, unknown?]>;
  };
  let mediaRepository: {
    create: jest.Mock<Media, [Partial<Media>]>;
    save: jest.Mock<Promise<Media>, [Media]>;
    findOne: jest.Mock<Promise<Media | null>, [unknown]>;
    softDelete: jest.Mock<Promise<unknown>, [string]>;
  };

  type UploadStreamCallback = (
    error: Error | null,
    result?: UploadApiResponse,
  ) => void;

  type UploadStreamResult = {
    end: jest.Mock<void, [Buffer]>;
  };

  const uploadStreamMock = cloudinary.uploader
    .upload_stream as unknown as jest.Mock<
    UploadStreamResult,
    [unknown, UploadStreamCallback]
  >;

  const destroyMock = cloudinary.uploader.destroy as jest.Mock<
    Promise<{ result: string }>,
    [string, { resource_type?: string }?]
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          'cloudinary.cloudName': 'cloud-name',
          'cloudinary.apiKey': 'api-key',
          'cloudinary.apiSecret': 'api-secret',
          'cloudinary.maxImageSizeBytes': 5 * 1024 * 1024,
        };

        return values[key];
      }),
    };

    mediaRepository = {
      create: jest.fn((input: Partial<Media>) => buildMedia(input)),
      save: jest.fn((media: Media) => Promise.resolve(media)),
      findOne: jest.fn<Promise<Media | null>, [unknown]>(),
      softDelete: jest
        .fn<Promise<unknown>, [string]>()
        .mockResolvedValue({ affected: 1 }),
    };

    cloudinaryService = new CloudinaryService(
      configService as unknown as ConfigService<ApplicationConfiguration, true>,
      mediaRepository as unknown as Repository<Media>,
    );

    cloudinaryService.onModuleInit();
  });

  describe('uploadImage', () => {
    beforeEach(() => {
      uploadStreamMock.mockImplementation((_options, callback) => ({
        end: jest.fn<void, [Buffer]>(() => {
          callback(null, buildUploadResponse());
        }),
      }));
    });

    it('debe subir una imagen, guardar metadata y devolver respuesta normalizada', async () => {
      const file = buildFile();
      const result = await cloudinaryService.uploadImage(file);

      expect(uploadStreamMock).toHaveBeenCalledWith(
        {
          folder: 'aislafriopro',
          resource_type: 'image',
        },
        expect.any(Function),
      );
      expect(mediaRepository.create).toHaveBeenCalledWith({
        publicId: 'aislafriopro/test-image',
        url: 'http://res.cloudinary.com/test/image/upload/test-image.jpg',
        secureUrl:
          'https://res.cloudinary.com/test/image/upload/test-image.jpg',
        format: 'jpg',
        resourceType: 'image',
        width: 1920,
        height: 1080,
        bytes: 245000,
        originalName: 'test.jpg',
        uploadedById: null,
      });
      expect(mediaRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'media-id',
        publicId: 'aislafriopro/test-image',
        url: 'http://res.cloudinary.com/test/image/upload/test-image.jpg',
        secureUrl:
          'https://res.cloudinary.com/test/image/upload/test-image.jpg',
        format: 'jpg',
        resourceType: 'image',
        width: 1920,
        height: 1080,
        bytes: 245000,
        originalName: 'test.jpg',
        uploadedById: null,
        createdAt: new Date('2026-08-14T12:00:00.000Z'),
      });
    });

    it.each(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])(
      'debe permitir formato %s',
      async (mimeType) => {
        await expect(
          cloudinaryService.uploadImage(buildFile({ mimetype: mimeType })),
        ).resolves.toEqual(expect.objectContaining({ id: 'media-id' }));
      },
    );

    it('debe rechazar archivos que no sean imagen', async () => {
      await expect(
        cloudinaryService.uploadImage(
          buildFile({ mimetype: 'application/pdf' }),
        ),
      ).rejects.toThrow(BadRequestException);

      expect(uploadStreamMock).not.toHaveBeenCalled();
      expect(mediaRepository.save).not.toHaveBeenCalled();
    });

    it('debe rechazar imagenes que superen el tamaño maximo', async () => {
      await expect(
        cloudinaryService.uploadImage(buildFile({ size: 6 * 1024 * 1024 })),
      ).rejects.toThrow(BadRequestException);

      expect(uploadStreamMock).not.toHaveBeenCalled();
      expect(mediaRepository.save).not.toHaveBeenCalled();
    });

    it('debe eliminar el asset de Cloudinary si falla el guardado en base', async () => {
      mediaRepository.save.mockRejectedValueOnce(new Error('DB error'));
      destroyMock.mockResolvedValueOnce({ result: 'ok' });

      await expect(cloudinaryService.uploadImage(buildFile())).rejects.toThrow(
        'DB error',
      );

      expect(destroyMock).toHaveBeenCalledWith('aislafriopro/test-image');
    });
  });

  describe('deleteImage', () => {
    it('debe eliminar en Cloudinary y hacer soft delete en base', async () => {
      const media = buildMedia();
      mediaRepository.findOne.mockResolvedValue(media);
      destroyMock.mockResolvedValue({ result: 'ok' });

      await expect(
        cloudinaryService.deleteImage(media.publicId),
      ).resolves.toBeUndefined();

      expect(mediaRepository.findOne).toHaveBeenCalledWith({
        where: { publicId: media.publicId },
      });
      expect(destroyMock).toHaveBeenCalledWith(media.publicId, {
        resource_type: media.resourceType,
      });
      expect(mediaRepository.softDelete).toHaveBeenCalledWith(media.id);
    });

    it('debe lanzar BadRequestException si no se envia publicId', async () => {
      await expect(cloudinaryService.deleteImage('')).rejects.toThrow(
        BadRequestException,
      );

      expect(mediaRepository.findOne).not.toHaveBeenCalled();
      expect(destroyMock).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si no existe metadata', async () => {
      mediaRepository.findOne.mockResolvedValue(null);

      await expect(
        cloudinaryService.deleteImage('aislafriopro/no-existe'),
      ).rejects.toThrow(NotFoundException);

      expect(destroyMock).not.toHaveBeenCalled();
      expect(mediaRepository.softDelete).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si Cloudinary responde not found', async () => {
      const media = buildMedia();
      mediaRepository.findOne.mockResolvedValue(media);
      destroyMock.mockResolvedValue({ result: 'not found' });

      await expect(
        cloudinaryService.deleteImage(media.publicId),
      ).rejects.toThrow(NotFoundException);

      expect(mediaRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
