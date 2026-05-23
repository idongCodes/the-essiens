const nodemailer = require('nodemailer');

const smtpOptions = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

async function test() {
  try {
    const transporter = nodemailer.createTransport(smtpOptions);
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to: 'idongesit_essien@ymail.com',
      subject: 'Test Email',
      html: '<p>Test</p>'
    })
    console.log('Success')
  } catch (err) {
    console.error('Error:', err)
  }
}

test()
