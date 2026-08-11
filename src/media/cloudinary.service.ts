import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { ApplicationConfiguration } from '../config/configuration';

interface CloudinaryPingResponse {
  status: string;
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
}
