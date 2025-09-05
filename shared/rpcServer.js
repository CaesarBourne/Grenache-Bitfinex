const Link = require('grenache-nodejs-link')
const { PeerRPCServer} = require('grenache-nodejs-http')
const logger = require('./logger');
const Link = require('grenache-nodejs-link');

module.exports = ( {serviceName, port=1024, grape= 'http://grape1:30001'}, handlers) =>{

    const link =  new Link({grape})
    link.start()

    const peer = new PeerRPCServer(link, { timeout : 5000})
    peer.init();

    const transport = peer.transport('server')

    transport.listen(port);

    setInterval(() =>{
        link.announce(serviceName, transport.port, {} )
    }, 1000)

    transport.on('request', (rid, key, payload, handler) => {
        const fn  = handlers[key]
        if(!fn){
            return handler.reply(new Error(`Unknown Method ${key}`));
        }
        Promise.resolve(fn(payload))
        .then((res) => handler.reply(null, res))
        .catch((err) => {
            logger.error({service: serviceName, err : err.message})
            handler.reply(err)
        })
    })

    return {link, transport}
}

