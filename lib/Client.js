
const
  { Issuer } = require('openid-client'),
  jwtfed = require('jwtfed'),
  highlight = require('cli-highlight').highlight,
  uuidv4 = require('uuid/v4'),
  jose = require('node-jose')


class Client {
  constructor(clientid, redirect_uri, trustroot, keystore) {

    this.trustroot = trustroot
    this.keystore = keystore
    this.redirect_uri = redirect_uri
    this.providerCache = {}
    this.stateToClient = {}
    this.localMetadata = {
      client_id: clientid,
      redirect_uri: redirect_uri,
      client_secret: 'TQV5U29k1gHibH5bx1layBo0OSAvAbRT3UYW3EWrSYBB5swxjVfWUa1BS8lqzxG/0v9wruMcrGadany3',
      "token_endpoint_auth_method": 'private_key_jwt'
    }
    this.clientid = clientid
    this.openid = null
  }

  async authorizationCallback(query, checks) {

    if (!query.state) {
      throw new Error("Missing state in query string")
    }
    if (!this.stateToClient.hasOwnProperty(query.state)) {
      throw new Error("Cannot find the client stored for this client.")
    }
    let tokenset = null
    const client = this.stateToClient[query.state]
    return client.authorizationCallback(this.redirect_uri, query, checks) // => Promise
      .then((tokenSet) => {
        console.log('received and validated tokens %j', tokenSet);
        console.log('validated id_token claims %j', tokenSet.claims);
        tokenset = tokenSet
        if (!tokenSet.access_token) throw new Error("Missing access_token in response")
        return client.userinfo(tokenSet.access_token)
        return tokenSet
      })
      .then((userinfo) => {
        return {
          tokenSet: tokenset,
          userInfo: userinfo
        }
      })
  }




  async getProvider(id) {
    if (this.providerCache.hasOwnProperty(id)) {
      return this.providerCache[id]
    }
    const esf = new jwtfed.ESFetcher()
    console.log("getProvider(" + id + ")")
    console.log("----- trust root ----")
    console.log(JSON.stringify(this.trustroot, undefined, 2))
    const list = await esf.fetchChained(id)
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
    const metadataObject = metadata.getMetadata()
    // metadataObject.jwks_uri = 'http://localhost/'
    const provider = new Issuer(metadataObject)

    console.log('   --- Resolved metadata ---')
    console.log(highlight(JSON.stringify(metadata.getMetadata(), undefined, 2), {language: "json"}))
    console.log()

    let ks = await jose.JWK.asKeyStore(this.keystore)
    this.providerCache[id] = new provider.Client(this.localMetadata, ks)
    return this.providerCache[id]

  }

  getProviderFromState(state) {
    if (!this.stateToClient.hasOwnProperty(state)) {
      throw new Error("Could not obtain client reference from state")
    }
    const client = this.stateToClient[state]
    delete this.stateToClient[state]
    return client
  }

  async getAuthenticationRequest(session, id) {
    const provider = await this.getProvider(id)
    const state = uuidv4()
    let authnrequesturl = await  provider.authorizationUrl({
      redirect_uri: this.redirect_uri,
      scope: 'openid email',
      state
    })
    session.state = state
    console.log("Authentication request url is " + authnrequesturl)
    console.log("State to client stored in state " + state)
    this.stateToClient[state] = provider
    return authnrequesturl


  }

}

module.exports = Client
