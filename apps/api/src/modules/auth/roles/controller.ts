import { Elysia } from 'elysia';
import { dtoWithPermission } from '../';
import { dtoWithMiddlewares } from '../../../utils';
import { auth, authSwagger } from '../authentication/plugin';
import { withPermission } from '../roles/middleware';
import { PERMISSIONS } from './constants';
import { roleDestroyDto, roleIndexDto, roleShowDto, roleStoreDto, roleUpdateDto } from './dtos';
import { RoleFormatter } from './formatters';
import { RolesService } from './service';

const app = new Elysia({
  prefix: '/roles',
  detail: {
    tags: ['Role'],
  },
}).guard(authSwagger, (app) =>
  app
    .use(auth())
    .get(
      '',
      async ({ query }) => {
        const roles = await RolesService.index(query);
        const response = roles.map(RoleFormatter.response);
        return response;
      },
      dtoWithPermission(roleIndexDto, PERMISSIONS.ROLES.SHOW),
    )
    .get(
      '/:uuid',
      async ({ params: { uuid } }) => {
        const role = await RolesService.show({ uuid });
        const response = RoleFormatter.response(role);
        return response;
      },
      roleShowDto,
    )
    .post(
      '',
      async ({ body }) => {
        const role = await RolesService.store(body);
        const response = RoleFormatter.response(role);
        return response;
      },
      dtoWithMiddlewares(
        roleStoreDto,
        withPermission(PERMISSIONS.ROLES.UPDATE),
      ),
    )
    .patch(
      '/:uuid',
      async ({ params: { uuid }, body }) => {
        const role = await RolesService.update(uuid, body);
        const response = RoleFormatter.response(role);
        return response;
      },
      dtoWithMiddlewares(
        roleUpdateDto,
        withPermission(PERMISSIONS.ROLES.UPDATE),
      ),
    )
    .delete(
      '/:uuid',
      async ({ params: { uuid } }) => {
        await RolesService.destroy(uuid);
        return { message: 'Rol silindi' };
      },
      dtoWithMiddlewares(
        roleDestroyDto,
        withPermission(PERMISSIONS.ROLES.UPDATE),
      ),
    ),
);

export default app;
