import express from 'express'
import cors from 'cors'
import { corsOptions } from './middleware/cors'
import routes from './routes'

export const app = express()

app.use(cors(corsOptions))
app.use(express.json())

app.use('/api/v1', routes)

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})
