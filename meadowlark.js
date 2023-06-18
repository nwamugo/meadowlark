const express = require('express')
const { engine } = require('express-handlebars')

const handlers = require('./lib/handlers')

const app = express()

app.engine('handlebars', engine())
app.set('view engine', 'handlebars')

app.use(express.static(__dirname + '/public'))

app.get('/', handlers.home)

app.get('/about', handlers.about)

app.use(handlers.notFound)

app.use(handlers.serverError)


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Express started on http://localhost:${PORT} ` +
    'Press Ctrl+C to terminate.'
  )
})