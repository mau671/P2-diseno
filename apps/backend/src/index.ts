import express from 'express'
import cors from 'cors'
import { corsOptions } from './middleware/cors'
import routes from './routes'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors(corsOptions))
app.use(express.json())

app.use('/api/v1', routes)

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
})
