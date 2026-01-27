import type { CorsOptions } from "cors";
import type { CorsOptions } from 'cors'

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19000',
  'exp://192.168.*.*',
  'http://192.168.*.*:19000',
  /\.pages\.dev$/,
  /\.workers\.dev$/
]

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return origin === allowed
      if (allowed instanceof RegExp) return allowed.test(origin)
      return false
    })
    
    if (isAllowed) {
      callback(null, true)
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}
