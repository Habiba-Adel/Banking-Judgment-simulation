import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { DrizzleDb } from '../db/db.module';
import { users } from '../db/schema';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findUserById(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user;
  }
}