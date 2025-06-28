import { prepareFilters } from '#utils';
import { RolePlain } from '@onlyjs/db/prismabox/Role';
import { t } from 'elysia';
import { PERMISSION_KEYS } from './constants';

export const [roleFiltersDto, , filterRoles] = prepareFilters(RolePlain, {
  search: ['name', 'slug'],
  date: ['createdAt', 'updatedAt'],
});

const rolePermissionsDto = t.Union([
  t.Array(t.Literal('*'), {
    minItems: 1,
    maxItems: 1,
    uniqueItems: true,
  }),
  t.Array(t.Union(PERMISSION_KEYS.map((key) => t.Literal(key))), {
    uniqueItems: true,
  }),
]);

export const pagination = t.Object({
  page: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric()),
});

export const recordStatus = t.Object({
  recordStatus: t.Optional(
    t.Union([t.Literal('ACTIVE'), t.Literal('DELETED'), t.Literal('ALL')]),
  ),
});

export const roleIndexDto = t.Object({
  ...pagination.properties,
  ...recordStatus.properties,
  q: t.Optional(t.String()),
});

export const roleShowDto = t.Object({
  uuid: t.String(),
});

export const roleShowResponseDto = roleShowDto?.response?.[200];

export const roleStoreDto = t.Object({
  name: t.String({ minLength: 2, maxLength: 50 }),
  slug: t.String({ minLength: 2, maxLength: 50 }),
  permissions: t.Object({}, { additionalProperties: true }),
});

export const roleUpdateDto = t.Object({
  uuid: t.String(),
  name: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
  permissions: t.Optional(t.Object({}, { additionalProperties: true })),
});

export const roleDestroyDto = t.Object({
  uuid: t.String(),
});
