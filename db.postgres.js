const { Pool } = require('pg')
const _ = require('lodash')

const credentials = require('./config')

const { connectionString } = credentials.postgres[process.env.NODE_ENV || 'development']
const pool = new Pool({ connectionString })

module.exports = {
  getVacations: async () => {
    const { rows } = await pool.query('SELECT * FROM VACATIONS')
    return rows.map(row => {
      // uses Lodash’s mapKeys and camelCase functions to convert our database properties to camelCase.
      const vacation = _.mapKeys(row, (v, k) => _.camelCase(k))
      vacation.price = parseFloat(vacation.price.replace(/^\$/, ''))
      vacation.location = {
        search: vacation.locationSearch,
        coordinates: {
          lat: vacation.locationLat,
          lng: vacation.locationLng,
        },
      }
      return vacation
    })
  },
  addVacationInSeasonListener: async (email, sku) => {
    await pool.query(
      'INSERT INTO vacation_in_season_listeners (email, sku) ' +
      'VALUES ($1, $2) ' +
      'ON CONFLICT DO NOTHING',
      [email, sku]
    )
  },
}



// One thing to note is that we have to handle the price attribute carefully.
// PostgreSQL’s money type is converted to an already-formatted string by
// the pg library. And for good reason: as we’ve already discussed,
// JavaScript has only recently added support for arbitrary precision numeric
// types (BigInt), but there isn’t yet a PostgreSQL adapter that takes
// advantage of that (and it might not be the most efficient data type in any
// event). We could change our database schema to use a numeric type
// instead of the money type, but we shouldn’t let our frontend choices drive
// our schema. We could also deal with the preformatted strings that are
// being returned from pg, but then we would have to change all of our
// existing code, which is relying on price being a number. Furthermore,
// that approach would undermine our ability to do numeric calculations on
// the frontend (such as summing the prices of the items in your cart). For all
// of these reasons, we’re opting to parse the string to a number when we
// retrieve it from the database.