
const
  Router = require('koa-router'),
  jwtfed = require('jwtfed'),
  URL = require('url').URL

const ESREL = 'http://oauth.net/specs/federation/1.0/entity'

class JWTWebFinger {

  constructor(iss, metadata, authorityHints, kid, jwks) {
    this.iss = iss
    this.metadata = metadata
    this.authorityHints = authorityHints
    this.kid = kid
    this.jwks = new jwtfed.JWKS(jwks)
    this.signer = new jwtfed.EntityStatementSigner(this.jwks)

    this.router = new Router()
    this.router.get('/.well-known/webfinger', async (ctx, next) => this.webFinger(ctx, next) )
    this.router.get('/jwtfed/entitystatement', async (ctx, next) => this.jwtfed(ctx, next) )
  }

  routes() {
    return this.router.routes()
  }

  async webFinger(ctx, next) {
    let esurl = (new URL('/jwtfed/entitystatement', this.iss)).toString()
    if (ctx.query && ctx.query.resource && ctx.query.resource === this.iss) {
      console.log("Query")
      console.log(ctx.query)
      console.log("ISS" + this.iss)
      ctx.body = {
        subject: this.iss,
        links: [
          {
            rel: ESREL,
            href: esurl
          }
        ]
      }
    }
  }

  async jwtfed(ctx, next) {
    let es = new jwtfed.EntityStatement()
    es.add({
      "subTypes": ["openidClient"],
      "authorityHints": this.authorityHints,
      "metadata": {
        "openidClient": this.metadata
      },
      iss: this.iss,
      sub: this.iss,
      jwks: [this.jwks.getJWT('verify', this.kid)]
    })
    ctx.body = this.signer.sign(es, this.kid)
  }


}



module.exports = JWTWebFinger
