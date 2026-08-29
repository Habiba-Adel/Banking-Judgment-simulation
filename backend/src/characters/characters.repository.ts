import { Inject, Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { DrizzleDb } from '../db/db.module';
import { characters } from '../db/schema';

@Injectable()
export class CharactersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  findAllCharacters() {
    return this.db
      .select({
        id: characters.id,
        name: characters.name,
        role: characters.role,
        avatarUrl: characters.avatarUrl,
      })
      .from(characters)
      .orderBy(asc(characters.name));
  }
}
