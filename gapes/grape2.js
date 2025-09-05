const {Grape} = require('grenache-grape')

const grape = new Grape({
    dht_port: 20002,
    dht_bootstrap:[],
    api_port: 30002
})

grape.start();
