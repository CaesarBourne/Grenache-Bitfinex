// pub.js
const Link = require('grenache-nodejs-link')
const { PeerPub } = require('grenache-nodejs-pubsub')
module.exports = function createPublisher (topic, grape = 'http://grape1:30001') {
  const link = new Link({ grape })
  link.start()
  const pub = new PeerPub(link, {})
  pub.init()
  setInterval(() => link.announce(topic, pub.port, {}), 1000)
  return {
    publish: (msg) => pub.publish(topic, msg)
  }
}