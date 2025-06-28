import { treaty } from '@onlyjs/eden';
import { env } from '#/config/env';

export const api = treaty(env.apiUrl, {
  fetch: {
    credentials: 'include',
  },
});
