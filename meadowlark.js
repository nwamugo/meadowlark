const express = require('express')
const expressHandlebars = require('express-handlebars')
const multiparty = require('multiparty')
const cookieParser = require('cookie-parser')
const expressSession = require('express-session')

const handlers = require('./lib/handlers')
const weatherMiddleware = require('./lib/middleware/weather')
const flashMiddleware = require('./lib/middleware/flash')

const { credentials } = require('./config')

const app = express()

app.engine('handlebars', expressHandlebars({
  defaultLayout: 'main',
  helpers: {
    section: function(name, options) {
      if(!this._sections) this._sections = {}
      this._sections[name] = options.fn(this)
      return null
    },
  },
}))
app.set('view engine', 'handlebars')

app.use(express.static(__dirname + '/public'))

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(cookieParser(credentials.cookieSecret))
app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret,
}))

app.use(weatherMiddleware)
app.use(flashMiddleware)

app.get('/', handlers.home)

app.get('/about', handlers.about)

// handlers for browser-based form submission
app.get('/newsletter-signup', handlers.newsletterSignup)
app.post('/newsletter-signup/process', handlers.newsletterSignupProcess)
app.post(
  '/newsletter-signup/thank-you',
  handlers.newsletterSignupThankYou
)

app.get('/contest/vacation-photo', handlers.vacationPhotoContest)
app.get(
  '/contest/vacation-photo-ajax',
  handlers.vacationPhotoContestAjax
)
app.get(
  '/contest/vacation-photo-thank-you',
  handlers.vacationPhotoContestProcessThankYou
)
app.post('/contest/vacation-photo/:year/:month', (req, res) => {
  const form = new multiparty.Form()
  form.parse(req, (err, fields, files) => {
    if (err) return handlers.vacationPhotoContestProcessError(req, res)
    console.log('got fields: ', fields)
    console.log('and files: ', files)
    handlers.vacationPhotoContestProcess(req, res, fields, files)
  })
})

// handlers for fetch/JSON form submission
app.get('/newsletter', handlers.newsletter)
app.post('/api/newsletter-signup', handlers.api.newsletterSignup)

app.post('/api/vacation-photo-contest/:year/:month', (req, res) => {
  const form = new multiparty.Form()
  form.parse(req, (err, fields, files) => {
    if (err) return handlers.api
      .vacationPhotoContestError(req, res, err.message)
    handlers.api.vacationPhotoContest(req, res, fields, files)
  })
})

app.use(handlers.notFound)
app.use(handlers.serverError)


const PORT = process.env.PORT || 3000;


if(require.main === module) {
  app.listen(PORT, () => {
    console.log(`Express started on http://localhost:${PORT} ` +
      'Press Ctrl+C to terminate.'
    )
  })
} else {
  module.exports = app
}