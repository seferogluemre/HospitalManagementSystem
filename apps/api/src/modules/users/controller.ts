import { Elysia } from 'elysia';
import { dtoWithMiddlewares } from '../../utils';
import { dtoWithPermission } from '../auth';
import { auth, authSwagger } from '../auth/authentication/plugin';
import { PERMISSIONS } from '../auth/roles/constants';
import { ensureUserHasPermission } from '../auth/roles/helpers';
import { withPermission } from '../auth/roles/middleware';
import { userCreateDto, userDestroyDto, userIndexDto, userShowDto, userUpdateDto } from './dtos';
import { UserFormatter } from './formatters';
import { UsersService } from './service';
import { userRolesApp } from './user-roles';

const app = new Elysia({
  prefix: '/users',
  detail: {
    tags: ['User'],
  },
})
  .use(userRolesApp)
  .guard(authSwagger, (app) =>
    app
      .use(auth())
      .post(
        '', // add user
        async ({ body }) => {
          const user = await UsersService.store(body);
          return UserFormatter.response(user);
        },
        dtoWithMiddlewares(
          userCreateDto,
          withPermission(PERMISSIONS.USERS.CREATE),
        ),
      )
      .get(
        '', // index
        async ({ query }) => {
          const users = await UsersService.index(query);
          const response = users.map(UserFormatter.response);
          return response;
        },
        userIndexDto,
      )
      .get(
        '/:id', // show
        async ({ params: { id }, query }) => {
          const targetUser = await UsersService.show({ id }, query?.recordStatus, query?.status);
          const response = UserFormatter.response(targetUser);
          return response;
        },
        dtoWithPermission(userShowDto, PERMISSIONS.USERS.SHOW),
      )
      .patch(
        '/:id', // update
        async ({ params: { id }, body, user }) => {
          if (user.id !== id) {
            ensureUserHasPermission(user, PERMISSIONS.USERS.UPDATE);
          }

          const updatedUser = await UsersService.update(id, body);
          const response = UserFormatter.response(updatedUser);
          return response;
        },
        userUpdateDto,
      )
      .delete(
        '/:id', // destroy
        async ({ params: { id } }) => {
          await UsersService.destroy(id);
          return { message: 'Kullanıcı silindi' };
        },
        dtoWithMiddlewares(
          userDestroyDto,
          withPermission(PERMISSIONS.USERS.DESTROY),
        ),
      ),
  );

export default app;
