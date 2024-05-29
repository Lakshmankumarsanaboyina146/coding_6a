const express = require('express')

const app = express()

const path = require('path')

const covidDatabasePath = path.join(__dirname, 'covid19India.db')

app.use(express.json())

const {open} = require('sqlite')

const sqlite3 = require('sqlite3')

let covidDatabase = null

const intialisationAndStartServer = async () => {
  try {
    covidDatabase = await open({
      filename: covidDatabasePath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`Data Base Error ${e.message}`)
    process.exit(1)
  }
}

intialisationAndStartServer()

const convertDatabaseResposneCamelCaseResponse = state => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  }
}

//API 1
app.get('/states/', async (request, response) => {
  const statesQuery = `SELECT * FROM state ORDER BY state_id `

  const statesArray = await covidDatabase.all(statesQuery)

  const camelCasesStatesArray = statesArray.map(state =>
    convertDatabaseResposneCamelCaseResponse(state),
  )

  response.send(camelCasesStatesArray)
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params

  const getstateQuery = `
  SELECT * FROM state WHERE state_id=${stateId};
  `
  const dataofSpecificState = await covidDatabase.get(getstateQuery)

  const camelCasedataofSpecificState =
    convertDatabaseResposneCamelCaseResponse(dataofSpecificState)

  response.send(camelCasedataofSpecificState)
})

const postDataConvertIntoDatabaseResponse = districts => {
  return {
    district_name: districts.districtName,
    state_id: districts.stateId,
    cases: districts.cases,
    cured: districts.cured,
    active: districts.active,
    deaths: districts.deaths,
  }
}

//API 3

app.post('/districts/', async (request, response) => {
  const districtData = request.body
  const districtDetails = postDataConvertIntoDatabaseResponse(districtData)
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const addDetailQuery = `
  INSERT INTO district (
    district_name,
    state_id,
    cases,cured,active,deaths
  )
  VALUES(
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  );
  `

  const addDetailsintoDatabase = await covidDatabase.run(addDetailQuery)
  response.send('District Successfull')
})
