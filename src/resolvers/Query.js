const Query = {
  async items(parent, args, ctx, info) {
    const items = await ctx.db.query.items();
    return items;
  },
  async item(parent, args, ctx, info) {
    const item = await ctx.db.query.item({ where: args.where });
    return item;
  }
};

module.exports = Query;
