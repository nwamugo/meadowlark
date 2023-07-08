const { credentials } = require('./config')
const Vacation = require('./models/vacation.model')
const VacationInSeasonListener = require('./models/vacationInSeasonListener.model')

const mongoose = require('mongoose')
const env = process.env.NODE_ENV || "development"
const { connectionString } = credentials.mongo[env]
if (!connectionString) {
  console.error('MongoDB connection string missing!')
  process.exit(1)
}
mongoose.connect(connectionString)
const db = mongoose.connection
db.on('error', err => {
  console.error('MongoDB error: ' + err.message)
  process.exit(1)
})
db.once('open', () => console.log('MongoDB connection established'))

// seed vacation data (if necessary)
Vacation.find((err, vacations) => {
  if (err) return console.error(err)
  if (vacations.length) return

  new Vacation({
    name: 'Hood River Day Trip',
    slug: 'hood-river-day-trip',
    category: 'Day Trip',
    sku: 'HR199',
    description: 'Spend a day sailing on the Columbia and ' +
      'enjoying craft beers in Hood River!',
    price: 99.95,
    tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
    inSeason: true,
    maximumGuests: 16,
    available: true,
    packagesSold: 0,
  }).save()

  new Vacation({
    name: 'Oregon Coast Getaway',
    slug: 'oregon-coast-getaway',
    category: 'Weekend Getaway',
    sku: 'OC39',
    description: 'Enjoy the ocean air and quaint coastal towns!',
    price: 269.95,
    tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
    inSeason: false,
    maximumGuests: 8,
    available: true,
    packagesSold: 0,
  }).save()

  new Vacation({
      name: 'Rock Climbing in Bend',
      slug: 'rock-climbing-in-bend',
      category: 'Adventure',
      sku: 'B99',
      description: 'Experience the thrill of climbing in the high desert.',
      price: 289.95,
      tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing'],
      inSeason: true,
      requiresWaiver: true,
      maximumGuests: 4,
      available: false,
      packagesSold: 0,
      notes: 'The tour guide is currently recovering from a skiing accident.',
  }).save()
})


module.exports = {
  // getVacations: async (options = {}) => {
  //   const vacation = [
  //     {
  //       name: 'Hood River Day Trip',
  //       slug: 'hood-river-day-trip',
  //       category: 'Day Trip',
  //       sku: 'HR199',
  //       description: 'Spend a day sailing on the Columbia and ' +
  //         'enjoying craft beers in Hood River!',
  //       location: {
  //         search: 'Hood River, Oregon, USA',
  //       },
  //       price: 99.95,
  //       tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
  //       inSeason: true,
  //       maximumGuests: 16,
  //       available: true,
  //       packagesSold: 0,
  //     }
  //   ]

  //   if(options.available !== undefined) {
  //     return vacations.filter(({ available }) =>
  //       available === options.available
  //     )
  //     return vacations
  //   }
  // },
  getVacations: async (options = {}) => Vacation.find(options),
  addVacationInSeasonListener: async (email, sku) => {
    // upsert is a portmanteau of
    // “update” and “insert”). Basically, if a record with the given email address
    //  doesn’t exist, it will be created. If a record does exist, it will be updated.
    //  Then we use the magic variable $push to indicate that we want to add a
    //  value to an array.

//     This code doesn’t prevent multiple SKUs from being added to the record if the user fills out the
// form multiple times. When a vacation comes into season and we find all the customers who
// want to be notified, we will have to be careful not to notify them multiple times.
    await VacationInSeasonListener.updateOne(
      { email },
      { $push: { skus: sku } },
      { upsert: true }
    )
  },
}


// The astute reader may worry that our database abstraction layer isn’t doing much to “protect” its
// technology-neutral objective. For example, a developer may read this code and see that they can
// pass any Mongoose options along to the vacation model, and then the application would be
// using features that are specific to Mongoose, which will make it harder to switch databases. We
// could take some steps to prevent this. Instead of just passing things to Mongoose, we could look
// for specific options and handle them explicitly, making it clear that any implementation would
// have to provide those options. But for the sake of this example, we’re going to let this slide and
// keep this code simple.