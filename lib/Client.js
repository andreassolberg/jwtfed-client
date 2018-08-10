
const
  { Issuer } = require('openid-client'),
  jwtfed = require('jwtfed'),
  highlight = require('cli-highlight').highlight


class Client {
  constructor(clientid, redirect_uri, trustroot) {

    this.trustroot = trustroot
    this.providerCache = {}
    this.localMetadata = {
      client_id: clientid,
      redirect_uri: redirect_uri,
      client_secret: 'TQV5U29k1gHibH5bx1layBo0OSAvAbRT3UYW3EWrSYBB5swxjVfWUa1BS8lqzxG/0v9wruMcrGadany3',
      "token_endpoint_auth_method": 'private_key_jwt'
    }
    this.clientid = clientid
    this.openid = null
  }

  async getProvider(id) {
    if (this.providerCache.hasOwnProperty(id)) {
      return this.providerCache[id]
    }
    const esf = new jwtfed.ESFetcher()
    console.log("getProvider(" + id + ")")
    console.log("----- trust root ----")
    console.log(JSON.stringify(this.trustroot, undefined, 2))
    return esf.fetchChained(id)
      .then((list) => {
        const tc = new jwtfed.TrustChain(this.trustroot)
        list.forEach((es) => {
          tc.add(es)
        })
        let paths = tc.findPaths()
        if (paths.length === 0) {
          throw new Error("No trust paths found")
        }

        console.log()
        console.log(highlight("Discovered trusted paths ", {language: "markdown"}))
        console.log(highlight(JSON.stringify(paths, undefined, 2), {language: "json"}))
        console.log()



        const metadata = tc.validate(paths[0], 'openidProvider')
        const provider = new Issuer(metadata.getMetadata())

        console.log('   --- Resolved metadata ---')
        console.log(highlight(JSON.stringify(metadata.getMetadata(), undefined, 2), {language: "json"}))
        console.log()


        this.providerCache[id] = new provider.Client(this.localMetadata)
        return this.providerCache[id]
      })
  }

  async getAuthenticationRequest(id) {
    const provider = await this.getProvider(id)
    return provider.authorizationUrl({
      redirect_uri: 'https://client.example.com/callback',
      scope: 'openid email',
    })
  }

}

module.exports = Client
