const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  }
});

const emailTemplate = (text, user) => `
  <div class="email" style="
    padding: 20px;
    font-family: sans-serif;
    line-height: 2;
    font-size: 20px;
  ">
    <h3>Hello, ${user.name}</h3>
    <p>${text}</p>

    <small>FlexFits Inc</small>
  </div>
`;

const passwordResetMail = (user, resetToken) => transport.sendMail({
  from: 'no-reply@flexfits.com',
  to: user.email,
  subject: 'Your password reset token',
  html: emailTemplate(
    `Your password reset token is here. <br />
    <a style="
      background: #258afb;
      padding: 10px 15px;
      color: #fff;
      text-decoration: none;
    " href="${process.env.FRONTEND_URL}/reset_password?resetToken=${resetToken}">Click here to reset Password</a>
    `,
    user
  ),
});

exports.transport = transport;
exports.emailTemplate = emailTemplate;
exports.passwordResetMail = passwordResetMail;
