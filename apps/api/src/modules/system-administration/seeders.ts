import { GoneException } from '#utils';
import prisma from '@onlyjs/db';
import { RolesService } from '../auth';
import { UsersService } from '../users';

export class SeedersService {
  static async setupInitial() {
    const usersCount = await prisma.user.count();

    if (usersCount > 0) {
      throw new GoneException('Halihazırda bir kullanıcı olduğu için kullanıcı kaydı yapılamaz');
    }

    // Admin rolünü oluştur
    const adminRole = await RolesService.store({
      name: 'Admin',
      description: 'Sistem yöneticisi',
      permissions: ['*'], // Tüm yetkiler
      slug: 'admin',
    });

    await RolesService.store({
      name: 'Basic',
      description: 'Temel kullanıcı',
      permissions: [],
      slug: 'basic',
    });

    // Admin kullanıcısını oluştur
    const user = await UsersService.store({
      password: 'password',
      email: 'admin@example.com',
      firstName: 'System',
      lastName: 'Admin',
      rolesSlugs: [adminRole.slug],
    });

    return {
      user,
    };
  }
}
