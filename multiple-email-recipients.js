const nodemailer = require('nodemailer')
const { credentials } = require('./config')

const mailTransport = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  auth: {
    user: credentials.sendgrid.user,
    pass: credentials.sendgrid.password
  }
})


async function go() {
  try {
    const result = await mailTransport.sendMail({
      from: '"Meadowlark Travel" <info@meaowlarktravel.com>',
      to: 'joe@gmail.com, "Jane Customer" <jane@yahoo.com>, ' +
        'fred@hotmail.com',
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



// Note that, in this example, we mixed plain email addresses
// (joe@gmail.com) with email addresses specifying the recipient’s name
// (“Jane Customer” <jane@yahoo.com>). This is allowed syntax.
// When sending email to multiple recipients, you must be careful to observe
// the limits of your MSA. SendGrid, for example, recommends limiting the
// number of recipients (SendGrid recommends no more than a thousand in
// one email).