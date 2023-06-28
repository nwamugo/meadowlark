const express = require('express')
const expressHandlebars = require('express-handlebars')

const handlers = require('./lib/handlers')

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

app.get('/', handlers.home)

app.get('/about', handlers.about)

app.get('/newsletter-signup', handlers.newsletterSignup)

app.post('/newsletter-signup/process', handlers.newsletterSignupProcess)

app.post('/newsletter-signup/thank-you', handlers.newsletterSignupThankYou)

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