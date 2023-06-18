const express = require('express')
const { engine } = require('express-handlebars')

const fortune = require('./lib/fortune');


const app = express()

app.engine('handlebars', engine())
app.set('view engine', 'handlebars')

app.use(express.static(__dirname + '/public'))

app.get('/', (request, response) => response.render('home'))

app.get('/about', (request, response) => {
  response.render('about', { fortune: fortune.getFortune() })
})

app.use((request, response) => {
  // response.type('text/html')
  // the view engine returns a content type of text/html and a status code of 200, by default
  response.status(404)
  response.render('404')
})

app.use((err, request, response, next) => {
  console.error(err.message)
  response.status(500)
  response.render('500')
})


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Express started on http://localhost:${PORT} ` +
    'Press Ctrl+C to terminate.'
  )
})