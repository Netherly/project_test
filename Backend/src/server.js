require('dotenv').config()
const app = require('./app')
const { initRatesAutofillJob } = require('./jobs/rates.autofill.job')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})

initRatesAutofillJob()
