const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { passwordResetMail } = require('../mail');

const Helper = {
  generateToken(user, response) {
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // Set the JWT token as a cookie on the response
    response.cookie('token', token, {
      httpOnly: true,
      maxAge: TIME.ONE_YEAR,
    });
  },

  userLoggedIn(userId) {
    if (!userId) {
      throw new Error('You must be logged in');
    }
  }
}

const TIME = {
  ONE_HOUR: 1000 * 60 * 60,
  ONE_YEAR: 1000 * 60 * 60 * 24 * 365,
}

const Mutation = {
  /** ITEMS  */
  async createItem(parent, { data }, { db, request }, info) {
    const { userId } = request;
    Helper.userLoggedIn(userId);
    const item = await db.mutation.createItem({
      data: {
        ...data,
        user: {
          connect: {
            id: userId
          }
        }
      }
    }, info);

    return item;
  },

  async updateItem(parent, { data, where }, { db, request }, info) {
    Helper.userLoggedIn(request.userId);
    const item = await db.mutation.updateItem({ data, where }, info);
    return item;
  },

  async deleteItem(parent, { where }, { db, request }, info) {
    Helper.userLoggedIn(request.userId);
    const item = await db.query.item({ where }, `
      {
        id
        title
      }
    `);
    // TODO: Check if they own the item or have permissions

    return db.mutation.deleteItem(where, info);
  },

  /** USERS */
  async signup(parent, args, { db, response }, info) {
    args.email = args.email.toLowerCase();
    const password = await bcrypt.hash(args.password, 10);
    try {
      const user = await db.mutation.createUser({
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] },
        }
      }, info);
      Helper.generateToken(user, response);
      return user
    } catch(error) {
      if (
        error.message.match(/unique constraint would be violated on User. Details: Field name = email/)
      ) {
        throw new Error('Email has already been registered');
      }
    }
  },

  async signin(parent, { email, password }, { db, response }, info) {
    // fetch user
    const user = await db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`Email does not exist!`);
    }
    // check if password is valid
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid Password!");
    }
    Helper.generateToken(user, response);
    return user;
  },

  signout(parent, args, { response }, info) {
    response.clearCookie('token');
    return { message: 'Signed Out' }
  },

  async requestPasswordReset(parent, { email }, { db }, info) {
    // Check if the user is valid
    const user = await db.query.user({ where: { email }});
    if (!user) {
      throw new Error('Email does not exist');
    }
    // Set a reset token on that user and set an expiry date
    const resetToken = (await promisify(randomBytes)(20)).toString('hex')
    const resetTokenExpiry = Date.now() + TIME.ONE_HOUR;
    await db.mutation.updateUser({
      where: { email },
      data: { resetToken, resetTokenExpiry }
    });
    // Email them the token
    await passwordResetMail(user, resetToken);
    return { message: "Successful!" }
  },

  async resetPassword(parent, args, { db, response }, info) {
    const { resetToken, password, confirmPassword } = args;
    // check if confirmPassword matches newPassword
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    // Check if valid token
    const [user] = await db.query.users({
      where: {
        resetToken,
        resetTokenExpiry_gte: Date.now() - TIME.ONE_HOUR,
      }
    });
    if (!user) {
      throw new Error("Invalid or expired token");
    }
    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);
    // save password and remove old resetToken and resetTokenExpiry
    const updatedUser = await db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password: passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      }
    });
    Helper.generateToken(updatedUser, response);
    return updatedUser;
  }
};

module.exports = Mutation;
