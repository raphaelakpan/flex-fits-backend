const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Helper = {
  generateToken(user, ctx) {
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // Set the JWT token as a cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year expiry
    });
  }
}

const Mutation = {
  /** ITEMS  */
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
  },

  /** USERS */
  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    const password = await bcrypt.hash(args.password, 10);
    const user = await ctx.db.mutation.createUser({
      data: {
        ...args,
        password,
        permissions: { set: ['USER'] },
      }
    }, info);
    Helper.generateToken(user, ctx);
    return user
  },

  async signin(parent, { email, password }, ctx, info) {
    // fetch user
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`Email does not exist!`);
    }
    // check if password is valid
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid Password!");
    }
    Helper.generateToken(user, ctx);
    return user;
  },

  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Signed Out' }
  }
};

module.exports = Mutation;
