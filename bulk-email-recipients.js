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
  const largeRecipientList = new Array(2000).fill().map((_, idx) =>
    `customer${idx}@nowhere.com`
  )
  const recipientLimit = 100
  const batches = largeRecipientList.reduce((batches, r) => {
    const lastBatch = batches[batches.length - 1]
    if (lastBatch.length < recipientLimit)
      lastBatch.push(r)
    else
      batches.push([r])
    return batches
  }, [[]])
  try {
    const results = await Promise.all(batches.map(batch =>
      mailTransport.sendMail({
        from: '"Meadowlark Travel" <info@meaowlarktravel.com>',
        to: batch.join(', '),
        subject: 'Special price on Hood River travel package!',
        text: 'Book your trip to scenic Hood River now!',
      })
    ))
    console.log(results)
  } catch(err) {
    console.log('at least one email batch failed: ' + err.message)
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