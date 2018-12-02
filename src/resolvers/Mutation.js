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
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { where: args.where }
    const item = await ctx.db.query.item(where, `
      {
        id
        title
      }
    `);
    // TODO: Check if they own the item or have permissions

    return ctx.db.mutation.deleteItem(where, info);
  }
};

module.exports = Mutation;
