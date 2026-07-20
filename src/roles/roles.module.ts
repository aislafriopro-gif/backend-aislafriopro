import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/roles.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Role])],    
    controllers: [],
    providers: [RolesService],
})
export class RolesModule {}