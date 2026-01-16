import { drizzle } from 'drizzle-orm/node-postgres'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { Pool } = require('pg')

import * as schema from './schema'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.VITE_DATABASE_URL || '',
})

export const db = drizzle(pool, { schema })
