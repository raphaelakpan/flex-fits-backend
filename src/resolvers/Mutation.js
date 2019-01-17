const bcrypt = require('bcryptjs');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { passwordResetMail } = require('../mail');
const {
  userLoggedIn,
  generateToken,
  TIME,
  hasPermission,
  PERMISSIONS,
  validatePassword,
  doNotUpdateDefaultAdmin,
} = require('./utils');
const stripe = require('../stripe');

const Mutation = {
  /** ITEMS  */
  async createItem(parent, { data }, { db, request }, info) {
    const { userId } = request;
    userLoggedIn(userId);
    const item = await db.mutation.createItem(
      {
        data: {
          ...data,
          user: {
            connect: {
              id: userId,
            },
          },
        },
      },
      info
    );

    return item;
  },

  async updateItem(parent, { data, where }, { db, request }, info) {
    // validate required fields as not empty if present
    ['title', 'description'].forEach(field => {
      if (data[field] === undefined) return;
      if (!data[field].trim()) {
        throw new Error('Please provide valid values to update');
      }
    });
    const { user, userId } = request;
    userLoggedIn(userId);
    const item = await db.query.item(
      {
        where,
      },
      `{
        user { id }
      }`
    );
    // Check if they own the item or have permissions
    item.user.id !== userId &&
      hasPermission(user, [PERMISSIONS.ADMIN, PERMISSIONS.ITEM_DELETE]);
    return db.mutation.updateItem(
      {
        data,
        where,
      },
      info
    );
  },

  async deleteItem(parent, { where }, { db, request }, info) {
    const { user, userId } = request;
    userLoggedIn(userId);
    const item = await db.query.item(
      {
        where,
      },
      `{
        user { id }
      }`
    );
    // Check if they own the item or have permissions
    item.user.id !== userId &&
      hasPermission(user, [PERMISSIONS.ADMIN, PERMISSIONS.ITEM_DELETE]);

    return db.mutation.deleteItem(where, info);
  },

  /** USERS */
  async signup(parent, args, { db, response }, info) {
    args.email = args.email.toLowerCase();
    validatePassword(args, args.password);
    const password = await bcrypt.hash(args.password, 10);
    try {
      const user = await db.mutation.createUser(
        {
          data: {
            ...args,
            password,
            permissions: {
              set: ['USER'],
            },
          },
        },
        info
      );
      generateToken(user, response);
      return user;
    } catch (error) {
      if (
        error.message.match(
          /unique constraint would be violated on User. Details: Field name = email/
        )
      ) {
        throw new Error('Email has already been registered');
      }
    }
  },

  async signin(parent, { email, password }, { db, response }, info) {
    // fetch user
    const user = await db.query.user({
      where: {
        email,
      },
    });
    if (!user) {
      throw new Error('Email does not exist!');
    }
    // check if password is valid
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid Password!');
    }
    generateToken(user, response);
    return user;
  },

  signout(parent, args, { response }, info) {
    response.clearCookie('token');
    return {
      message: 'Signed Out',
    };
  },

  async requestPasswordReset(parent, { email }, { db }, info) {
    // Check if the user is valid
    const user = await db.query.user({
      where: {
        email,
      },
    });
    if (!user) {
      throw new Error('Email does not exist');
    }
    doNotUpdateDefaultAdmin(user);
    // Set a reset token on that user and set an expiry date
    const resetToken = (await promisify(randomBytes)(20)).toString('hex');
    const resetTokenExpiry = Date.now() + TIME.ONE_HOUR;
    await db.mutation.updateUser({
      where: {
        email,
      },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });
    // Email them the token
    await passwordResetMail(user, resetToken);
    return {
      message: 'Successful!',
    };
  },

  async resetPassword(parent, args, { db, response }, info) {
    const { resetToken, password, confirmPassword } = args;
    // check if confirmPassword matches newPassword
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Check if valid token
    const [user] = await db.query.users({
      where: {
        resetToken,
        resetTokenExpiry_gte: Date.now() - TIME.ONE_HOUR,
      },
    });
    if (!user) {
      throw new Error('Invalid or expired token');
    }
    validatePassword(user, password);
    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);
    // save password and remove old resetToken and resetTokenExpiry
    const updatedUser = await db.mutation.updateUser({
      where: {
        email: user.email,
      },
      data: {
        password: passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    generateToken(updatedUser, response);
    return updatedUser;
  },

  async updatePermissions(
    parent,
    { permissions, userId },
    { db, request },
    info
  ) {
    userLoggedIn(request.userId);
    hasPermission(request.user, [PERMISSIONS.ADMIN]);
    doNotUpdateDefaultAdmin(request.user);
    // Ensure user cannot remove ADMIN permission from their account
    if (
      request.user.id === userId &&
      !permissions.includes(PERMISSIONS.ADMIN)
    ) {
      throw new Error('You cannot remove ADMIN permission from your account');
    }
    return db.mutation.updateUser(
      {
        where: {
          id: userId,
        },
        data: {
          permissions: {
            set: permissions,
          },
        },
      },
      info
    );
  },

  async addToCart(parent, { itemId }, { db, request }, info) {
    const { userId } = request;
    userLoggedIn(request.userId);
    // fetch existing cartItem for the userID and itemID
    const [existingCartItem] = await db.query.cartItems({
      where: {
        user: {
          id: userId,
        },
        item: {
          id: itemId,
        },
      },
    });
    // if found, increment quantity by 1
    if (existingCartItem) {
      return db.mutation.updateCartItem(
        {
          where: {
            id: existingCartItem.id,
          },
          data: {
            quantity: existingCartItem.quantity + 1,
          },
        },
        info
      );
    }
    // no cartIten record exists so we'll create a new one
    return db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
          item: {
            connect: {
              id: itemId,
            },
          },
        },
      },
      info
    );
  },

  async removeFromCart(parent, { id }, { db, request }, info) {
    const { userId } = request;
    userLoggedIn(userId);
    const cartItem = await db.query.cartItem(
      {
        where: {
          id,
        },
      },
      `{
        user { id }
      }`
    );
    if (!cartItem) {
      throw new Error('No Cart Item found!');
    }
    // check if user owns the item or has permissions
    cartItem.user.id !== userId && hasPermission(user, [PERMISSIONS.ADMIN]);
    // we're here so delete the item :)
    return db.mutation.deleteCartItem(
      {
        where: {
          id,
        },
      },
      info
    );
  },

  async createOrder(parents, { token }, { request, db }, info) {
    // check if user is logged in
    userLoggedIn(request.userId);
    const user = await db.query.user(
      {
        where: {
          id: request.userId,
        },
      },
      `{
        id
        cart {
          id
          quantity
          item {
            id title description price image largeImage user {
              id
            }
          }
        }
      }`
    );
    // recalculate the total price for the order
    const amount = user.cart.reduce(
      (sum, cartItem) => sum + cartItem.item.price * cartItem.quantity,
      0
    );

    // create the stripe charge
    const charge = await stripe.charges.create({
      amount,
      currency: 'USD',
      source: token,
    });

    // convert cartItems to orderItems
    const orderItems = user.cart.map(cartItem => {
      const { item, quantity } = cartItem;
      return {
        quantity,
        title: item.title,
        description: item.description,
        price: item.price,
        image: item.image,
        largeImage: item.largeImage,
        soldBy: {
          connect: {
            id: item.user.id,
          },
        },
        originalItem: {
          connect: {
            id: item.id,
          },
        },
      };
    });
    // create the order
    const order = await db.mutation.createOrder(
      {
        data: {
          total: charge.amount,
          items: {
            create: orderItems,
          },
          user: {
            connect: {
              id: user.id,
            },
          },
          charge: charge.id,
        },
      },
      info
    );
    // clean up the user's cart, delete cartItems
    const cartItemIds = user.cart.map(cartItem => cartItem.id);
    await db.mutation.deleteManyCartItems({
      where: {
        id_in: cartItemIds,
      },
    });
    // return the order to the client
    return order;
  },

  async updateUser(parent, args, { request, db }, info) {
    // check if user is logged in
    const { userId } = request;
    userLoggedIn(userId);
    doNotUpdateDefaultAdmin(request.user);
    const { name, currentPassword, newPassword, confirmPassword } = args;
    if (currentPassword) {
      if (newPassword !== confirmPassword)
        throw new Error("Passwords don't match");
      const user = await db.query.user(
        {
          where: { id: userId },
        },
        `{ name, email, password }`
      );
      // validate their current password
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) throw new Error('Invalid current Password!');
      // perform password validations
      validatePassword(user, newPassword);
      const passwordHash = await bcrypt.hash(newPassword, 10);
      return db.mutation.updateUser(
        {
          where: { id: userId },
          data: { password: passwordHash },
        },
        info
      );
    } else if (name) {
      return db.mutation.updateUser(
        {
          where: { id: userId },
          data: { name },
        },
        info
      );
    }
    // if we're here the user didn't provide any values to update
    throw new Error('Provide valid values to update');
  },
};

module.exports = Mutation;
