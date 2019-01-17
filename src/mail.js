const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

const passwordResetMail = (user, resetToken) =>
  sgMail.send({
    from: 'no-reply@flexfits.com',
    to: user.email,
    subject: 'Your password reset token',
    html: emailTemplate(
      `Your password reset token is here. <br /> <br />
      <a style="
        background: #258afb;
        padding: 10px 15px;
        color: #fff;
        text-decoration: none;
      " href="${
        process.env.FRONTEND_URL
      }/reset_password?resetToken=${resetToken}">Click here to reset Password</a>
    `,
      user
    ),
  });

exports.passwordResetMail = passwordResetMail;
