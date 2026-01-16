import { drizzle } from 'drizzle-orm/node-postgres'
import pkg from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()
const { Pool } = pkg

import * as schema from './schema'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.VITE_DATABASE_URL || '',
})

export const db = drizzle(pool, { schema })
