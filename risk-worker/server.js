import 'dotenv/config'
import createRpcServer from '../shared/rpcServer.js'

const MAX_QTY = 10 // demo guard

const handlers = {
  'risk.check': async ({ qty }) => {
    if (!qty || qty <= 0) return { ok: false, reason: 'INVALID_QTY' }
    if (qty > MAX_QTY) return { ok: false, reason: 'LIMIT_EXCEEDED' }
    return { ok: true }
  }
}

createRpcServer({ serviceName: 'svc:risk', port: 10260, grape: process.env.GRAPE || 'http://grape1:30001' }, handlers)
console.log('[risk] up')
