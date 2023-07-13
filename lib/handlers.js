const fortune = require('./fortune')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')

// we'll want these promise-based versions of fs functions in our async function
const mkdir = promisify(fs.mkdir)
const rename = promisify(fs.rename)

const db = require('../db.mongo')

// slightly modified version of the official W3C HTML5 email regex:
// https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
const VALID_EMAIL_REGEX = new RegExp(
  // eslint-disable-next-line no-useless-escape
  '^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
  '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' +
  // eslint-disable-next-line no-useless-escape
  '(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$'
)

// fake "newsletter signup" interface
class NewsletterSignup {
  constructor({ name, email }) {
    this.name = name
    this.email = email
  }
  async save() {
    // here's where we would do the work of saving to a database
    // since this method is async, it will return a promise, and
    // since we're not throwing any errors, the promise will
    // resolve successfully
  }
}

exports.home = (req, res) => res.render('home');
exports.about = (req, res) =>
  res.render('about', { fortune: fortune.getFortune() })


// these handlers are for browser-submitted forms
exports.newsletterSignup = (req, res) => {
  res.render('newsletter-signup', { csrf: 'CSRF token goes here' })
}
exports.newsletterSignupProcess = (req, res) => {
  const name = req.body.name || ''
  const email = req.body.email || ''

  if (!VALID_EMAIL_REGEX.test(email)) {
    req.session.flash = {
      type: 'danger',
      intro: 'Validation error!',
      message: 'The email address you entered was not valid.',
    }
    return res.redirect(303, '/newsletter-signup')
  }

  new NewsletterSignup({ name, email }).save()
    .then(() => {
      req.session.flash = {
        type: 'success',
        intro: 'Thank you!',
        message: 'You have now been signed up for the newsletter.',
      }
      return res.redirect(303, 'newsletter/archive')
    })
    // eslint-disable-next-line no-unused-vars
    .catch(err => {
      req.session.flash = {
        type: 'danger',
        intro: 'Database error!',
        message: 'There was a database error; please try again later.',
      }
      return res.redirect(303, '/newsletter/archive')
    })
  // Because the flash message is being transferred from the session to res.locals.flash in
  // middleware, you have to perform a redirect for the flash message to be displayed. If you want to
  // display a flash message without redirecting, set res.locals.flash instead of
  // req.session.flash
}
exports.newsletterSignupThankYou = (req, res) =>
  res.render('newsletter-signup-thank-you')
exports.newsletterArchive = (req, res) =>
  res.render('newsletter-archive')

exports.vacationPhotoContest = (req, res) => {
  const now = new Date()
  res.render('contest/vacation-photo', {
    year: now.getFullYear(),
    month: now.getMonth()
  })
}
exports.vacationPhotoContestAjax = (req, res) => {
  const now = new Date()
  res.render('contest/vacation-photo-ajax', {
    year: now.getFullYear(),
    month: now.getMonth()
  })
}
exports.vacationPhotoContestProcess = (req, res, fields, files) => {
  console.log('field data: ', fields)
  console.log('files: ', files)
  res.redirect(303, '/contest/vacation-photo-thank-you')
}
exports.vacationPhotoContestProcessError = (req, res) => {
  res.redirect(303, '/contest/vacation-photo-error')
}
exports.vacationPhotoContestProcessThankYou = (req, res) => {
  res.render('contest/vacation-photo-thank-you')
}
exports.listVacations = async (req, res) => {
  const vacations = await db.getVacations({ available: true})
  const currency = req.session.currency || 'USD'
//   We could have saved some typing by doing this:
// const context = {
// vacations: products.map(vacations => {
// vacation.price = '$' + vacation.price.toFixed(2)return vacation
// })
// }
// That would certainly save us a few lines of code, but in my experience,
// there are good reasons not to pass unmapped database objects directly to
// views. The view gets a bunch of properties it may not need, possibly in
// formats that are incompatible with it. Our example is pretty simple so far,
// but once it starts to get more complicated, you’ll probably want to do even
// more customization of the data that’s passed to a view. It also makes it
// easy to accidentally expose confidential information or information that
// could compromise the security of your website. For these reasons, I
// recommend mapping the data that’s returned from the database and
// passing only what’s needed onto the view (transforming as necessary, as
// we did with price).
  const context = {
    currency: currency,
    vacations: vacations.map(vacation => {
      return {
        sku: vacation.sku,
        name: vacation.name,
        description: vacation.description,
        inSeason: vacation.inSeason,
        price: convertFromUSD(vacation.price, currency),
        qty: vacation.qty,
      }
    })
  }
  switch(currency) {
    case 'USF':
      context.currencyUSD = 'selected';
      break;
    case 'GBP':
      context.currencyGBP = 'selected';
      break;
    case 'BTC':
      context.currencyBTC = 'selected';
      break;
  }
  res.render('vacations', context)
}
exports.setCurrency = (req, res) => {
  req.session.currency = req.params.currency
  return res.redirect(303, '/vacations')
}
exports.notifyWhenInSeasonForm = (req, res) =>
  res.render('notify-me-when-in-season', { sku: req.params.sku })

exports.notifyWhenInSeasonProcess = async (req, res) => {
  const { email, sku } = req.body
  await db.addVacationInSeasonListener(email, sku)
  return res.redirect(303, '/vacations')
}
// end browser-submitted form handlers


// create directory to store vacation photos (if it doesn't already exist)
const dataDir = path.resolve(__dirname, '..', 'data')
console.log('dataDir >>', dataDir)
const vacationPhotosDir = path.join(dataDir, 'vacation-photos')
console.log('vacationPhotosDir >>', vacationPhotosDir)
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)
if (!fs.existsSync(vacationPhotosDir)) {
  fs.mkdirSync(vacationPhotosDir)
}

function saveContestEntry(
  contestName,
  email,
  year,
  month,
  photoPath
) {
  // TODO: this will come later
}

function convertFromUSD(value, currency) {
  switch(currency) {
    case 'USD':
      return value * 1
    case 'GBP':
      return value * 0.79
    case 'BTC':
      return value * 0.000078
    default:
      return NaN
  }
}


// these handlers are for fetch/JSON form handlers
exports.newsletter = (req, res) => {
  res.render('newsletter', { csrf: 'CSRF token goes here' })
}
exports.api = {
  newsletterSignup: (req, res) => {
    console.log('CSRF token (from hidden form field: ' + req.body._csrf)
    console.log('Name (from visible form field): ' + req.body.name)
    console.log('Email (from visible form field): ' + req.body.email)
    res.send({ result: 'success' })
  },
  vacationPhotoContest: async (req, res, fields, files) => {
    console.log('field data: ', fields)
    console.log('files: ', files)

    const photo = files.photo[0]
    const dir = vacationPhotosDir + '/' + Date.now()
    const path = dir + '/' + photo.originalFilename
    await mkdir(dir)
    await rename(photo.path, path)
    saveContestEntry(
      'vacation-photo',
      fields.email,
      req.params.year,
      req.params.month,
      path
    )
    res.send({ result: 'success' })
  },
  vacationPhotoContestError: (req, res, message) => {
    res.send({ result: 'error', error: message })
  }
}
//  end fetch/JSON form handlers

async function getSpecialsFromDatabase() {
  return {
    name: 'Deluxe Technicolor Widget',
    price: '$29.95',
  }
}

exports.specials = async (req, res, next) => {
  res.locals.special = await getSpecialsFromDatabase()
  next()
}

exports.specialsPage = (req, res) =>
  res.render('page-with-specials')

exports.authorize = function authorize(req, res, next) {
  if (req.session.authorized) return next()
  res.render('not-authorized')
}

exports.notFound = (req, res) => res.render('404')

// Express recognizes the error handler by way of its four arguments
// so we have to disable ESLint's no-unused-vars rule
/* eslint-disable no-unused-vars */
exports.serverError = (err, req, res, next) => {
  console.error(err.message, err.stack)
  res.render('500')
}
/*eslint-enable no-unused-vars */



// In general, you should never trust anything that the user uploads because it’s a possible vector
// for your website to be attacked. For example, a malicious user could easily take a harmful
// executable, rename it with a .jpg extension, and upload it as the first step in an attack (hoping to
// find some way to execute it at a later point). Likewise, we are taking a little risk here by naming
// the file using the name property provided by the browser; someone could also abuse this by
// inserting special characters into the filename. To make this code completely safe, we would give
// the file a random name, taking only the extension (making sure it consists only of alphanumeric
// characters).