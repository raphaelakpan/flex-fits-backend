const jwt = require('jsonwebtoken');

const generateToken = function (user, response) {
  const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
  // Set the JWT token as a cookie on the response
  response.cookie('token', token, {
    httpOnly: true,
    maxAge: TIME.ONE_YEAR,
  });
}

const userLoggedIn = function (userId) {
  if (!userId) {
    throw new Error('You must be logged in');
  }
}

const hasPermission = function (user, permissionsNeeded) {
  const matchedPermissions = user.permissions.filter(permission =>
    permissionsNeeded.includes(permission)
  );
  if (!matchedPermissions.length) {
    throw new Error('You do not have sufficient permissions');
  }
}

const TIME = {
  ONE_HOUR: 1000 * 60 * 60,
  ONE_YEAR: 1000 * 60 * 60 * 24 * 365,
}

const PERMISSIONS = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  ITEM_CREATE: 'ITEM_CREATE',
  ITEM_UPDATE: 'ITEM_UPDATE',
  ITEM_DELETE: 'ITEM_DELETEs',
}

module.exports = {
  generateToken,
  userLoggedIn,
  hasPermission,
  TIME,
  PERMISSIONS,
};
