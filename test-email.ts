import { sendEmail } from './src/lib/email'

async function test() {
  try {
    await sendEmail({
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
