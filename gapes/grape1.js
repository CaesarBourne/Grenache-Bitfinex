const {Grape} = require('grenache-grape')

const grape = new Grape({
    dht_port: 20001,
    dht_bootstrap:[],
    api_port: 30001
})

grape.start();