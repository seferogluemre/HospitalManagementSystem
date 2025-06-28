import type { Prisma } from "@onlyjs/db/client";
import { UserPlain } from "@onlyjs/db/prismabox/User";
import { t } from "elysia";

export const pagination = t.Object({
  page: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric()),
});

export function getUserFilters(query?: { id?: string; username?: string; email?: string }) {
  if (!query) {
    return [false, [], undefined] as const;
  }

  const filters: Prisma.UserWhereInput[] = [];
  const { id, email } = query;

  if (id) {
    filters.push({ id });
  }

  if (email) {
    filters.push({ email });
  }

  return [filters.length > 0, filters, undefined] as const;
}

export const recordStatus = t.Object({
  recordStatus: t.Optional(
    t.Union([t.Literal("ACTIVE"), t.Literal("DELETED"), t.Literal("ALL")])
  ),
});

export const userResponseSchema = t.Object({
  id: UserPlain.properties.id,
  email: UserPlain.properties.email,
  firstName: UserPlain.properties.firstName,
  lastName: UserPlain.properties.lastName,
  createdAt: UserPlain.properties.createdAt,
  updatedAt: UserPlain.properties.updatedAt,
  phone: UserPlain.properties.phone,
});
export const userIndexDto = t.Object({
  ...pagination.properties,
  ...recordStatus.properties,
  q: t.Optional(t.String()),
});

export const userShowDto = t.Object({
  id: t.String(),
  ...recordStatus.properties,
});

export const userCreateDto = t.Object({
  firstName: t.String({ minLength: 2, maxLength: 50 }),
  lastName: t.String({ minLength: 2, maxLength: 50 }),
  email: t.String({ format: "email" }),
  password: t.String(),
  phone: t.Optional(t.String()),
  role: t.String(), // We will replace this with t.Enum(Role) later
});

export const userUpdateDto = t.Object({
  id: t.String(),
  firstName: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
  lastName: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
  phone: t.Optional(t.String()),
});

export const userDestroyDto = t.Object({
  id: t.String(),
});
