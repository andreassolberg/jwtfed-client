
const { Issuer } = require('openid-client');


const providerId = 'https://accounts.google.com'

class Client {
  constructor(clientid) {
    this.clientid = clientid
    this.openid = null
    Issuer.discover(providerId) // => Promise
      .then((provider) => {
        console.log('Discovered issuer %s', provider);
        console.log(JSON.stringify(provider, undefined, 2))

        this.openid = new provider.Client({
          client_id: clientid,
          client_secret: 'TQV5U29k1gHibH5bx1layBo0OSAvAbRT3UYW3EWrSYBB5swxjVfWUa1BS8lqzxG/0v9wruMcrGadany3',
          "token_endpoint_auth_method": 'xxx'
        }) // => Client
      })
  }

  getAuthenticationRequest() {
    return this.openid.authorizationUrl({
      redirect_uri: 'https://client.example.com/callback',
      scope: 'openid email',
    })
  }

}

module.exports = Client
