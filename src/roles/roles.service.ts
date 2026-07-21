import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleName } from './entities/roles.entity';

@Injectable()
export class RolesService implements OnModuleInit {

    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) {}


    async onModuleInit() {
    await this.seedRoles();
  }

  private async seedRoles() {
    const defaultRoles:RoleName[] = [RoleName.ADMIN, RoleName.USER, RoleName.CLIENT, RoleName.TECHNICIAN];

    for (const name of defaultRoles) {
      const exists = await this.roleRepository.findOneBy({ name });
      if (!exists) {
        await this.roleRepository.save(this.roleRepository.create({ name }));
      }
    }
  }
}