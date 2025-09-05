const Link = require('grenache-nodejs-link')
const { PeerRPCClient} = require('grenache-nodejs-http')
const logger = require('./logger');

module.exports = ( {serviceName, port=1024, grape= 'http://grape1:30001'}, handlers) =>{

    const link =  new Link({grape})
    link.start()

    const peer = new PeerRPCClient(link, { timeout : 5000})
    peer.init();

    function call(serviceName, name, payload = {}, timeout = 5000){
        return new Promise((resolve, reject) => {
            peer.request(serviceName, {method, psyload}, {timeout}, (err, data) => {
                if(err){
                    logger.error({service: serviceName, err : err.message})
                    return reject(err);
                }
                resolve(data);
            })
        })
    }
    return{call}
}