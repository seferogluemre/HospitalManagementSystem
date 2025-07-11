import prisma from '@onlyjs/db';
import { Prisma, type User } from '@onlyjs/db/client';
import { PrismaClientKnownRequestError } from '@onlyjs/db/client/runtime/library';
import { UserWhereUnique } from '@onlyjs/db/prismabox/User';
import { ConflictException, InternalServerErrorException, NotFoundException } from '../../utils';
import { betterAuth } from '../auth/authentication/instance';
import { getUserFilters } from './dtos';
import type { UserCreatePayload, UserIndexQuery, UserUpdatePayload } from './types';
import { UserRolesService } from './user-roles';

enum RecordStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
  ALL = 'ALL',
}

enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ALL = 'ALL',
}

type RequiredNonNullableObject<T extends object> = { [P in keyof Required<T>]: NonNullable<T[P]> };

interface UserPayload {
  name?: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export abstract class UsersService {
  private static async handlePrismaError(
    error: unknown,
    context: 'find' | 'create' | 'update' | 'delete',
  ) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }
      if (error.code === 'P2002' && context === 'create') {
        throw new ConflictException('Kullanıcı adı zaten alınmış');
      }
    }
    throw error;
  }

  private static async prepareUserPayload(payloadRaw: UserUpdatePayload): Promise<UserPayload> {
    const email = payloadRaw.email?.toLowerCase();

    const { firstName, lastName, isActive, gender } = payloadRaw;

    const name = firstName && lastName ? `${firstName} ${lastName}` : undefined;

    const userPayload = { name, email, firstName, lastName, isActive, gender };

    return Object.fromEntries(
      Object.entries(userPayload).filter(([_, value]) => value !== undefined),
    ) as UserPayload;
  }

  static async index(query?: UserIndexQuery): Promise<User[]> {
    const filterQuery = query
      ? {
          ...query,
          email: query.email === null ? undefined : query.email,
        }
      : undefined;

    const [hasFilters, filters] = getUserFilters(filterQuery);
    const where: Prisma.UserWhereInput = {};

    if (hasFilters) {
      where.OR = filters;
    }

    if (query?.recordStatus === RecordStatus.DELETED) {
      where.deletedAt = { not: null };
    } else if (query?.recordStatus === RecordStatus.ALL) {
      // Do nothing
    } else {
      where.deletedAt = null;
    }

    if (query?.status === Status.ACTIVE) {
      where.isActive = true;
    } else if (query?.status === Status.INACTIVE) {
      where.isActive = false;
    }

    return prisma.user.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async show(
    where: typeof UserWhereUnique.static,
    recordStatus?: keyof typeof RecordStatus,
    status?: keyof typeof Status,
  ) {
    let deletedFilter: { deletedAt: Prisma.UserWhereUniqueInput['deletedAt'] } | null = {
      deletedAt: null,
    }; // Varsayılan olarak aktif kayıtlar
    if (recordStatus === RecordStatus.DELETED) {
      deletedFilter = { deletedAt: { not: null } }; // Sadece silinmiş kayıtlar
    } else if (recordStatus === RecordStatus.ALL) {
      deletedFilter = null; // Tüm kayıtlar
    }

    let activeFilter: { isActive: boolean } | null = null;
    if (status === Status.ACTIVE) {
      activeFilter = { isActive: true };
    } else if (status === Status.INACTIVE) {
      activeFilter = { isActive: false };
    }

    const whereInput = where as Prisma.UserWhereInput;

    if (whereInput.rolesSlugs) {
      whereInput.rolesSlugs = {
        hasSome: whereInput.rolesSlugs as string[],
      };
    }

    const user = await prisma.user.findFirst({
      where: {
        ...whereInput,
        ...(deletedFilter || {}),
        ...(activeFilter || {}),
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return user;
  }

  static async store(payload: UserCreatePayload): Promise<User> {
    try {
      const userPayload = await this.prepareUserPayload(payload);

      const signInResponse = await betterAuth.api.signUpEmail({
        body: {
          ...(userPayload as RequiredNonNullableObject<typeof userPayload>),
          password: payload.password,
        },
      });

      await UserRolesService.update(signInResponse.user.id, payload.rolesSlugs);

      const updates: Prisma.UserUpdateInput = {};


      const updatedUser = await prisma.user.update({
        where: { id: signInResponse.user.id },
        data: updates,
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Bu kullanıcı adı veya email zaten kullanılıyor');
        }
      }
      throw error;
    }
  }

  static async update(id: string, payload: UserUpdatePayload): Promise<User> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      const userPayload = await this.prepareUserPayload(payload);

      const updates: Prisma.UserUpdateInput = { ...userPayload };



          if (file !== null) {
            const fileLibraryAsset = await FileLibraryAssetsService.store({
              file,
              type: FileLibraryAssetType.USER_IMAGE,
            });

            updates.imageAsset = { connect: { id: fileLibraryAsset.id } };
            updates.image = fileLibraryAsset.path;
          } else {
            updates.imageAsset = { disconnect: true };
            updates.image = null;
          }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updates,
      });

      if (!updatedUser) {
        throw new InternalServerErrorException('Bilinmeyen bir hata oluştu');
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Bu kullanıcı adı veya email zaten kullanılıyor');
        }
      }
      throw error;
    }
  }

  static async destroy(id: string): Promise<void> {
    try {
      await betterAuth.api.removeUser({
        body: {
          userId: id,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Kullanıcı bulunamadı');
        }
      }
      throw error;
    }
  }

  static async restore(id: string) {
    try {
      const user = await prisma.user.findFirst({
        where: { id, deletedAt: { not: null } },
      });

      if (!user) {
        throw new NotFoundException('Kullanıcı bulunamadı veya zaten aktif');
      }

      return await prisma.user.update({
        where: { id },
        data: { deletedAt: null },
      });
    } catch (error) {
      await this.handlePrismaError(error, 'update');
      throw error;
    }
  }
}
