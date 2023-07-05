const nodemailer = require('nodemailer')
const { credentials } = require('./config')

const mailTransport = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  auth: {
    user: credentials.sendgrid.user,
    pass: credentials.sendgrid.password
  }
})

// a simple example that sends text mail to only one recipient
async function go() {
  try {
    const result = await mailTransport.sendMail({
      from: '"Meadowlark Travel" <info@meaowlarktravel.com>',
      to: 'tickettoduzz@gmail.com',
      subject: 'Your Meadowlark Travel Tour',
      text: 'Thank you for booking your trip with Meadowlark Travel. ' +
        'We look forward to your visit!',
    })
    console.log('mail sent successfully: ', result)
  } catch(err) {
    console.log('could not send mail: ' + err.message)
  }
}

go()



// it’s important to
// understand that no errors doesn’t necessarily mean your email was
// delivered successfully to the recipient. The callback’s error parameter
// will be set only if there was a problem communicating with the MSA
// (such as a network or authentication error). If the MSA was unable to
// deliver the email (for example, because of an invalid email address or an
// unknown user), you will have to check your account activity in your mail
// service, which you can do either from the admin interface or through an
// API.
// If you need your system to automatically determine whether the email was
// delivered successfully, you’ll have to use your mail service’s API. Consult
// the API documentation for your mail service for more information.