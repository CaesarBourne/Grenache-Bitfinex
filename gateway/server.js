import 'dotenv/config'
import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { WebSocketServer } from 'ws'
import createRpcClient from '../shared/rpcClient.js'
import createSubscriber from '../shared/sub.js'

const app = express()
app.use(express.json())

const rpc = createRpcClient(process.env.GRAPE)

function auth (req, res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return res.status(401).json({ error: 'NO_TOKEN' })
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next() } catch { return res.status(401).json({ error: 'BAD_TOKEN' }) }
}

// Sign-up / sign-in (demo: store via order-svc user method)
app.post('/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'EMAIL_PASSWORD_REQUIRED' })
  const passwordHash = await bcrypt.hash(password, 10)
  const resp = await rpc.call(process.env.ORDERS_SERVICE, 'users.getOrCreate', { email, passwordHash })
  const token = jwt.sign({ uid: resp.user.id, email }, process.env.JWT_SECRET)
  res.json({ token })
})

app.post('/orders', auth, async (req, res) => {
  const { symbol, side, type, qty, price } = req.body
  try {
    const result = await rpc.call(process.env.ORDERS_SERVICE, 'orders.create', { userId: req.user.uid, symbol, side, type, qty, price })
    res.json(result)
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

app.get('/orders/:id', auth, async (req, res) => {
  const result = await rpc.call(process.env.ORDERS_SERVICE, 'orders.get', { orderId: Number(req.params.id) })
  if (!result.ok) return res.status(404).json(result)
  res.json(result)
})

app.get('/market/latest', async (req, res) => {
  const symbol = req.query.symbol || 'BTCUSD'
  const limit = Number(req.query.limit || 50)
  const result = await rpc.call(process.env.MARKET_SERVICE, 'market.latest', { symbol, limit })
  res.json(result)
})

// Health & metrics (minimal)
app.get('/health', (req, res) => res.json({ ok: true }))
app.get('/metrics', (req, res) => res.type('text/plain').send('demo_metric 1'))

const server = app.listen(process.env.PORT, () => console.log(`[gateway] http :${process.env.PORT}`))

// WebSocket stream: forward market ticks
const wss = new WebSocketServer({ server, path: '/ws' })
const clients = new Set()

wss.on('connection', (ws) => {
  clients.add(ws)
  ws.on('close', () => clients.delete(ws))
})

createSubscriber(process.env.TICKS_TOPIC, (msg) => {
  for (const ws of clients) {
    try { ws.send(msg.toString()) } catch {}
  }
}, process.env.GRAPE)
