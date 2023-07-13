const express = require('express')
const cluster = require('cluster')
const fs = require('fs')
const { create } = require('express-handlebars')
const multiparty = require('multiparty')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const expressSession = require('express-session')
const RedisStore = require('connect-redis')(expressSession)

const handlers = require('./lib/handlers')
const weatherMiddleware = require('./lib/middleware/weather')
const flashMiddleware = require('./lib/middleware/flash')
const cartValidation = require('./lib/middleware/cartValidation')

const { credentials } = require('./config')
const vhost = require('vhost')

require('./db')
const addRoutes = require('./routes')
addRoutes(app)

const app = express()
// create "admin" subdomain... this should appear
// before all your other routes
const admin = express.Router()
// express.Router() essentially creates a new instance of the Express
// router. You can treat this instance just like your original instance (app).
// You can add routes and middleware just as you would to app. However, it
// won’t do anything until you add it to app. We add it through vhost, which
// binds that router instance to that subdomain.
app.use(vhost('admin.meadowlark.local', admin))

const hbs = create({
  defaultLayout: 'main',
  helpers: {
    section: function(name, options) {
      if(!this._sections) this._sections = {}
      this._sections[name] = options.fn(this)
      return null
    },
  },
})

app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')

app.use(express.static(__dirname + '/public'))

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

switch(app.get('env')) {
  case 'development':
    app.use(morgan('dev')) // https://github.com/expressjs/morgan
    break
  case 'production':
    // eslint-disable-next-line no-case-declarations
    const stream = fs.createWriteStream(__dirname + '/access.log', { flags: 'a' })
    // Alternatively, you could take a more Unix-like approach and save the logs in a subdirectory of /var/log, as Apache does by default.
    app.use(morgan('combined', { stream })) // https://httpd.apache.org/docs/current/logs.html#combined
    break
}
app.use(cookieParser(credentials.cookieSecret))
app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret,
  store: new RedisStore({
    url: credentials.redis[app.get('env')].url,
    logErrors: true, // highly recommended!
  }),
}))

app.use((req, res, next) => {
  if(cluster.isWorker)
    console.log(`Worker ${cluster.worker.id} received cluster`)
    next()
})
app.use(weatherMiddleware)
app.use(flashMiddleware)
app.use(cartValidation.resetValidation)
app.use(cartValidation.checkWaivers)
app.use(cartValidation.checkGuestCounts)

app.get('/page-with-specials', handlers.specials, handlers.specialsPage)

app.get('/secret', handlers.authorize, () => res.render('secret'))

app.get('/', handlers.home)

app.get('/about', handlers.about)

// handlers for browser-based form submission
app.get('/set-currency/:currency', handlers.setCurrency)
app.get('/newsletter-signup', handlers.newsletterSignup)
app.post('/newsletter-signup/process', handlers.newsletterSignupProcess)
app.post(
  '/newsletter-signup/thank-you',
  handlers.newsletterSignupThankYou
  )

app.get('vacations', handlers.listVacations)
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

const staff = {
  mitch: { name: "Mitch",
    bio: 'Mitch is the man to have at your back in a bar fight.' },
  madeline: { name: "Madeline", bio: 'Madeline is our Oregon expert.' },
  walt: { name: "Walt", bio: 'Walt is our Oregon Coast expert.' },
}

app.get('/staff/:name', (req, res, next) => {
  const info = staff[req.params.name]
  if(!info) return next()   // will eventually fall through to 404
  res.render('05-staffer', info)
})

app.get('/staff', (req, res) => {
  res.render('05-staff', { staffUrls: Object.keys(staff).map(key => '/staff/' + key) })
})


const autoViews = {}
const { promisify } = require('util')
const fileExists = promisify(fs.exists)

app.use(async (req, res, next) => {
  const path = req.path.toLowerCase()
  try {
    // check cache; if it's there, render the view
    if (autoViews[path]) return res.render(autoViews[path])
    // if its' not in the cache, see if there's
    // a .handlebars file that matches
    if(await fileExists(__dirname + '/views' + path + '.handlebars')) {
      autoViews[path] = path.replace(/^\//, '')
      return res.render(autoViews[path])
    }
    // no view found; pass on to 404 handler
    next()
  } catch (error) {
    console.error(error)
  }
})

app.use(handlers.notFound)
app.use(handlers.serverError)

//create admin routes; these can be defined anywhere
admin.use('*', (req, res) => res.send('Welcome, Admin!'))



function startServer(port) {
  return app.listen(port, () => {
    console.log(`Express started in ` +
    `${app.get('env')} mode at http://localhost:${port} ` +
      'Press Ctrl+C to terminate.'
    )
  })
}

if(require.main === module) {
  // application run directly; start app server
  startServer(process.env.PORT || 3000)
} else {
  // application imported as a module via "require": export
  // function to create server
  module.exports = startServer
}