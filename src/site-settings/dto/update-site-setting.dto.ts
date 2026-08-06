import { PartialType } from '@nestjs/swagger';
import { CreateSiteSettingDto } from './create-site-setting.dto';

export class UpdateSiteSettingDto extends PartialType(CreateSiteSettingDto) {}
