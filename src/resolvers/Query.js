const { forwardTo } = require('prisma-binding');
const { userLoggedIn, hasPermission, PERMISSIONS } = require('./utils');

const Query = {
  /** ITEMS */
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),

  /** USERS */
  currentUser(parent, args, ctx, info) {
    const { userId } = ctx.request;
    if (!userId) return null;
    return ctx.db.query.user({
      where: { id: userId }
    }, info);
  },

  async users(parent, args, { db, request }, info) {
    const { userId, user } = request;
    userLoggedIn(userId);
    hasPermission(user, [PERMISSIONS.ADMIN]);
    const users = await db.query.users({}, info);
    return users;
  }
};

module.exports = Query;
