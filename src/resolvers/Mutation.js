const Mutation = {
  async createItem(parent, args, ctx, info) {
    const item = await ctx.db.mutation.createItem({
      data: { ...args.data }
    }, info);

    return item;
  },
  async updateItem(parent, args, ctx, info) {
    const item = await ctx.db.mutation.updateItem({
      data: args.data,
      where: args.where,
    }, info);

    return item;
  }
};

module.exports = Mutation;
