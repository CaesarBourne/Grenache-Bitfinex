import 'dotenv/config'
import mysql from 'mysql2/promise'
import createRpcServer from '../shared/rpcServer.js'
import createRpcClient from '../shared/rpcClient.js'

const pool = await mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10
})

// simple init
await (await pool.getConnection()).query('SELECT 1')

const rpc = createRpcClient(process.env.GRAPE)

const handlers = {
  'orders.create': async ({ userId, symbol, side, type, qty, price }) => {
    // call risk worker first
    const risk = await rpc.call(process.env.RISK_SERVICE, 'risk.check', { userId, symbol, side, type, qty, price })
    if (!risk.ok) return { ok: false, reason: risk.reason }

    const [res] = await pool.query(
      'INSERT INTO orders(user_id, symbol, side, type, price, qty) VALUES (?,?,?,?,?,?)',
      [userId, symbol, side, type, price || null, qty]
    )
    return { ok: true, orderId: res.insertId }
  },

  'orders.get': async ({ orderId }) => {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId])
    if (!rows.length) return { ok: false, reason: 'NOT_FOUND' }
    return { ok: true, order: rows[0] }
  },

  'users.getOrCreate': async ({ email, passwordHash }) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    if (rows.length) return { ok: true, user: rows[0] }
    const [res] = await pool.query('INSERT INTO users(email, password_hash) VALUES (?,?)', [email, passwordHash])
    const [rows2] = await pool.query('SELECT * FROM users WHERE id = ?', [res.insertId])
    return { ok: true, user: rows2[0] }
  }
}

createRpcServer({ serviceName: process.env.SERVICE_NAME, port: Number(process.env.PORT), grape: process.env.GRAPE }, handlers)
console.log(`[orders] up on ${process.env.PORT}`)
