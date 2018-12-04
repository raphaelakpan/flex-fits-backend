const { forwardTo } = require('prisma-binding');

const Query = {
  items: forwardTo('db'),
  async item(parent, args, ctx, info) {
    const item = await ctx.db.query.item({ where: args.where });
    return item;
  },
  itemsConnection: forwardTo('db'),
};

module.exports = Query;
