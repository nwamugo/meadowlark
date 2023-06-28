const express = require('express')
const expressHandlebars = require('express-handlebars')

const handlers = require('./lib/handlers')
const weatherMiddleware = require('./lib/middleware/weather')

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

app.use(weatherMiddleware)

app.get('/', handlers.home)

app.get('/about', handlers.about)

// handlers for browser-based form submission
app.get('/newsletter-signup', handlers.newsletterSignup)
app.post('/newsletter-signup/process', handlers.newsletterSignupProcess)
app.post('/newsletter-signup/thank-you', handlers.newsletterSignupThankYou)

// handlers for fetch/JSON form submission
app.get('/newsletter', handlers.newsletter)
app.post('/api/newsletter-signup', handlers.api.newsletterSignup)

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