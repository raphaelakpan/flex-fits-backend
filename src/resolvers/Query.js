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
  },

  async orders(parent, args, { request, db }, info) {
    const { userId, user } = request;
    userLoggedIn(userId);
    // if user is admin, fetch all orders
    if (user.permissions.includes([PERMISSIONS.ADMIN])) {
      return db.query.orders(args, info);
    }
    // otherwise fetch only orders that belong to the user
    return db.query.orders({
      where: {
        user: { id: userId },
      }, ...args }, info);
  },

  async ordersConnection(parent, args, { request, db }, info) {
    const { userId, user } = request;
    userLoggedIn(userId);
    if (user.permissions.includes([PERMISSIONS.ADMIN])) {
      return db.query.ordersConnection({}, info);
    }
    return db.query.ordersConnection({ where: {
      user: { id: userId }
    }}, info)
  }
};

module.exports = Query;
