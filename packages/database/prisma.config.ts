import type { PrismaConfig } from '@prisma/config';
import { loadEnv } from './config/env';

loadEnv();

export default {
  earlyAccess: true,
  schema: './schema.prisma',
} satisfies PrismaConfig;
