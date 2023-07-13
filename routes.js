const main = require('./handlers/main')

module.exports = app => {
  app.get('/', main.home)
  app.get('/about', main.about)
}