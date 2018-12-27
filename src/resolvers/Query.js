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
  },

  /** ORDERS */
  async order(parent, { id }, { request, db}, info) {
    const { userId, user } = request;
    userLoggedIn(userId);
    // we need to verify that the user owns the order or is an admin
    const order = await db.query.order({ where: { id } }, `{ user { id } }`);
    userId !== order.user.id && hasPermission(user, [PERMISSIONS.ADMIN]);
    return db.query.order({ where: { id } }, info);
  }
};

module.exports = Query;
