const querystring = require('querystring')
    , https = require('https')

const recipients = process.env.RECIPIENTS.split(';')
    , apiLogin = process.env.MAILGUN_API_LOGIN
    , apiKey = process.env.MAILGUN_API_KEY

exports.handler = (event, context, callback) => {
  const input = JSON.parse(event.body)

  const done = (statusCode, response) =>
    callback(null, {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': 'http://xn--er-leijonat-m8a.fi',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    })

  const fields = [
    { name: 'Etunimet', key: 'firstNames' },
    { name: 'Sukunimi', key: 'lastName' },
    { name: 'Osoite', key: 'address' },
    { name: 'Syntymäaika', key: 'dateOfBirth' },
    { name: 'Sähköpostiosoite', key: 'email' },
    { name: 'Huoltajan nimi', key: 'huoltajaName' },
    { name: 'Huoltajan sähköpostiosoite', key: 'huoltajaEmail' },
    { name: 'Huoltajan puhelinnumero', key: 'huoltajaPhone' },
    { name: 'Valokuvien julkaisulupa', key: 'photoPublicationOk' },
    { name: 'Lisätietoja', key: 'details' }
  ]

  const fieldString = (f) => `${f.name}:\n${input[f.key] || '–'}`

  const postData = querystring.stringify({
    from: 'Helsingin Erä-Leijonat <noreply@xn--er-leijonat-m8a.fi>',
    to: recipients.join(','),
    subject: 'Uusi jäsenhakemus lippukunnan nettisivuilla',
    text: 'Cha-ching! Uusi jäsen haluaa liittyä lippukuntaan:\n\n' + fields.map(fieldString).join('\n\n')
  })

  const options = {
    hostname: 'api.mailgun.net',
    path: `/v2/${apiLogin}/messages`,
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + new Buffer('api:' + apiKey).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  const req = https.request(
    options,
    (res) => {
      res.statusCode === 200
        ? done(200, { error: null })
        : done(500, { error: res.statusCode })

      res.on('data', (d) => { process.stdout.write(d) })
    })

  req.on('error', (e) => done(500, { error: e.message }))
  req.write(postData)
  req.end()
}