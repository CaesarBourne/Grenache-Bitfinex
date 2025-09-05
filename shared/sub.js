// sub.js
const Link = require('grenache-nodejs-link')
const { PeerSub } = require('grenache-nodejs-pubsub')
module.exports = function createSubscriber (topic, onMsg, grape = 'http://grape1:30001') {
  const link = new Link({ grape })
  link.start()
  const sub = new PeerSub(link, {})
  sub.init()
  sub.subscribe(topic, {})
  sub.on('message', onMsg)
  return sub
}