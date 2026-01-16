import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL or VITE_DATABASE_URL is missing')
}

const pool = new Pool({
  connectionString: connectionString || '',
})

export const db = drizzle(pool, { schema })
