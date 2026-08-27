import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MaterialDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  quantity!: string;
}

export class DiligenceDto {
  @IsString()
  @IsNotEmpty()
  workDone!: string;

  @IsString()
  @IsNotEmpty()
  observations!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDto)
  materials!: MaterialDto[];
}
