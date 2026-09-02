import { Global, Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleDb = NodePgDatabase<typeof schema>;

// Global: every module (Missions, Playthroughs, Attempts) needs DB access,
// so we expose it once here instead of re-importing DbModule everywhere.
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<DrizzleDb> => {
        const logger = new Logger('DbModule');

        const pool = new Pool({
          host: config.get<string>('DB_HOST'),
          port: parseInt(config.get<string>('DB_PORT') || '5432', 10),
          user: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME'),
          //this to can connect and communicate with neon wiithout any problems
          ssl: { rejectUnauthorized: false },
          // Neon kills idle connections server-side after its own timeout —
          // closing our end first (shorter than that) avoids the pool handing
          // out a connection Neon has already dropped, which otherwise
          // surfaces as "Connection terminated unexpectedly" on whatever
          // request happens to grab it next (found 2026-09-01, live error).
          idleTimeoutMillis: 10_000,
          keepAlive: true,
        });

        // Without this listener, a connection Neon drops while idle in the
        // pool emits an unhandled 'error' event on the Pool itself — Node
        // treats that as fatal. Logging it here keeps the pool (and the
        // server) alive; the pool transparently opens a fresh connection for
        // the next query.
        pool.on('error', (err) => {
          logger.error('Idle database connection error (pool recovers automatically)', err);
        });



                  //and the default behavior is the lazy connection but it will be better
                  //to test the db connection in the first 
                  try {
    await pool.query('SELECT 1');
    logger.log('✅ Database connection established successfully');
  } catch (err) {
    logger.error('❌ Failed to connect to the database', err);
    throw err; // يوقف السيرفر فوراً لو فيه مشكلة عشان تلحقي تصلحيها
  }




        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
