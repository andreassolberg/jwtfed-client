
const
  Client = require('./lib/Client'),
  Router = require('koa-router')

const Koa = require('koa');
const app = new Koa();
const router = new Router();
const PORT = 7000

const client = new Client('https://serviceprovider.andreas.labs.uninett.no/application1007')

router.get('/', async (ctx, next) => {
  let url = await client.getAuthenticationRequest()
  console.log("Sending user ahead with this authentication request " + url)
  ctx.redirect(url)
})
router.get('/callback', async (ctx, next) => {
  ctx.body = 'Hello callback()'
})




app
  .use(router.routes())
  .use(router.allowedMethods());
app.listen(PORT)
console.log("Listening on http://localhost:" + PORT + "/")
