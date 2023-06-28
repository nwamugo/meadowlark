const fortune = require('./fortune')

exports.home = (req, res) => res.render('home');

exports.about = (req, res) =>
  res.render('about', { fortune: fortune.getFortune() })

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
}

exports.notFound = (req, res) => res.render('404')

// Express recognizes the error handler by way of its four arguments
// so we have to disable ESLint's no-unused-vars rule
/* eslint-disable no-unused-vars */
exports.serverError = (err, req, res, next) => res.render('500')
/*eslint-enable no-unused-vars */