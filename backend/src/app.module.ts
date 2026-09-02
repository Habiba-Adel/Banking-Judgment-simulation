import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { MissionsModule } from './missions/missions.module';
import { PlaythroughsModule } from './playthroughs/playthroughs.module';
import { AttemptsService } from './attempts/attempts.service';
import { AttemptsController } from './attempts/attempts.controller';
import { AttemptsModule } from './attempts/attempts.module';
import { UsersModule } from './users/users.module';
import { CharactersModule } from './characters/characters.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DbModule, MissionsModule, PlaythroughsModule, AttemptsModule, UsersModule, CharactersModule],
  controllers: [AppController, AttemptsController],
  providers: [AppService, AttemptsService],
})
export class AppModule {}
