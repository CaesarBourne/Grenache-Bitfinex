const Link = require('grenache-nodejs-link')
const { PeerRPCClient} = require('grenache-nodejs-http')
const logger = require('./logger');

module.exports = ( {serviceName, port=1024, grape= 'http://grape1:30001'}, handlers) =>{

    const link =  new Link({grape})
    link.start()

    const peer = new PeerRPCClient(link, { timeout : 5000})
    peer.init();

   
    return{call}
}