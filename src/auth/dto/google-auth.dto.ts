import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    example: 'google-id-token',
    description: 'ID token emitido por Google Identity Services.',
  })
  @IsString({ message: 'El ID token debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El ID token es obligatorio.' })
  idToken!: string;
}
