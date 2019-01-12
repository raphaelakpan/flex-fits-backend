const jwt = require('jsonwebtoken');

const generateToken = function(user, response) {
  const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
  // Set the JWT token as a cookie on the response
  response.cookie('token', token, {
    httpOnly: true,
    maxAge: TIME.ONE_YEAR,
  });
};

const userLoggedIn = function(userId) {
  if (!userId) {
    throw new Error('You must be logged in');
  }
};

const hasPermission = function(user, permissionsNeeded) {
  const matchedPermissions = user.permissions.filter(permission =>
    permissionsNeeded.includes(permission)
  );
  if (!matchedPermissions.length) {
    throw new Error('You do not have sufficient permissions');
  }
};

const validatePassword = function(user, password) {
  if (password.trim() === '' || password.trim().length < 6) {
    throw new Error('Invalid password; must be 6 character long');
  }
  const includesName = user.name
    .toLowerCase()
    .split(' ')
    .some(name => password.toLowerCase().search(name) !== -1);
  const includesEmail = user.email.includes(password);
  if (includesName || includesEmail) {
    throw new Error('Invalid password; must not contain your name or email');
  }
};

const TIME = {
  ONE_HOUR: 1000 * 60 * 60,
  ONE_YEAR: 1000 * 60 * 60 * 24 * 365,
};

const PERMISSIONS = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  ITEM_CREATE: 'ITEM_CREATE',
  ITEM_UPDATE: 'ITEM_UPDATE',
  ITEM_DELETE: 'ITEM_DELETEs',
};

module.exports = {
  generateToken,
  userLoggedIn,
  hasPermission,
  TIME,
  PERMISSIONS,
  validatePassword,
};
