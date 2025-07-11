import type { Static } from 'elysia';
import type { Simplify, ValueOf } from 'type-fest';
import { PERMISSIONS } from './constants';
import {
  roleIndexDto,
  roleShowDto,
  roleShowResponseDto,
  roleStoreDto,
  roleUpdateDto,
} from './dtos';

export type Permission = string;

export type RoleShowResponse = Static<typeof roleShowResponseDto>;
export type RoleCreatePayload = Static<(typeof roleStoreDto)['body']>;
export type RoleUpdatePayload = Static<(typeof roleUpdateDto)['body']>;
export type RoleShowParams = Static<(typeof roleShowDto)['params']>;
export type RoleDestroyParams = RoleShowParams;

export type RoleIndexQuery = Static<(typeof roleIndexDto)['query']>;

export type GenericPermissionObject = { key: string; description: string; isHidden?: boolean };

export type BasePermissionObject = Simplify<
  ValueOf<{
    [K in keyof typeof PERMISSIONS]: ValueOf<(typeof PERMISSIONS)[K]>;
  }>
>;

export type PermissionObject =
  | BasePermissionObject
  | {
      key: '*';
      description: 'Tüm yetkilere izin ver';
    };

export type PermissionKey = BasePermissionObject['key'] | '*';

export type PermissionIdentifier = PermissionKey | PermissionObject;
