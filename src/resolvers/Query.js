const { forwardTo } = require('prisma-binding');

const Query = {
  items: forwardTo('db'),
  async item(parent, args, ctx, info) {
    const item = await ctx.db.query.item({ where: args.where });
    return item;
  },
  itemsConnection: forwardTo('db'),
  currentUser(parent, args, ctx, info) {
    const { userId } = ctx.request;
    if (!userId) return null;
    return ctx.db.query.user({
      where: { id: userId }
    }, info);
  }
};

module.exports = Query;
