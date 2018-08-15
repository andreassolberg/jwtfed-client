
const
  Client = require('./lib/Client'),
  Router = require('koa-router'),
  morgan = require('koa-morgan'),
  JWTWebFinger = require('./lib/JWTWebFinger'),
  nconf = require('nconf'),
  errors = require('koa-errors'),
  session = require('koa-session')

const Koa = require('koa')
const app = new Koa()
const PORT = 3000

app.keys = nconf.get('keys')

nconf.argv()
  .env({
    "separator": '__',
    "lowerCase": true
  })
  .file({ file: 'etc/config.json' })

console.log("ISS", nconf.get('iss'))

nconf.required(['iss', 'redirect_uri', 'redirect_uri', 'trustroot', 'keys', 'sessionConfig'])

const healthcheck = new Router();
healthcheck.get('/', async (ctx, next) => {
  ctx.body = 'OK!'
})


const webfinger = new JWTWebFinger(nconf.get('iss'), nconf.get('metadata'), nconf.get('authorityHints'), nconf.get('kid'), nconf.get('jwks'))
const client = new Client(nconf.get('iss'), nconf.get('redirect_uri'), nconf.get('trustroot'), nconf.get('privateJwks'))

const router = new Router();
router.get('/', async (ctx, next) => {
  ctx.body = 'OK!'
})
router.get('/auth', async (ctx, next) => {

  if (ctx.query && ctx.query.id) {
    let url = await client.getAuthenticationRequest(ctx.session, ctx.query.id)
    console.log("Sending user ahead with this authentication request " + url)
    ctx.redirect(url)
  } else {
    throw new Error("Missing query parameter id. Use the provider ID of the provider you would like to authenticate with.")
  }


})
router.get('/callback', async (ctx, next) => {

  const state = ctx.session.state
  // const nonce = ctx.session.nonce


  return client.authorizationCallback(ctx.query, { state }) // => Promise
    .then(function (data) {
      // console.log('received and validated tokens %j', tokenSet);
      // console.log('validated id_token claims %j', tokenSet.claims);

      // if (!tokenSet.access_token) {
      //   throw new Error("Could not get access token")
      // }

      ctx.body = JSON.stringify(data, undefined, 2)
    })

})


app
  .use(errors())
  .use(session(nconf.get('sessionConfig'), app))
  .use(morgan('combined'))
  .use(healthcheck.routes())
  .use(webfinger.routes())
  .use(router.routes())
  .use(router.allowedMethods());
app.listen(PORT)
console.log("Listening on http://localhost:" + PORT + "/")
