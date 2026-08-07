import { ApiProperty } from '@nestjs/swagger';

export class PublicSiteSettingsResponseDto {
  @ApiProperty({
    description: 'Configuraciones publicas indexadas por clave',
    example: {
      'contact.whatsapp': '+5491112345678',
      'site.email': 'info@aislafriopro.com',
    },
    additionalProperties: true,
  })
  settings!: Record<string, string | null>;
}
