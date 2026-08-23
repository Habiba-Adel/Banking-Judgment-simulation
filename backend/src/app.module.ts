import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { MissionsModule } from './missions/missions.module';
import { PlaythroughsModule } from './playthroughs/playthroughs.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DbModule, MissionsModule, PlaythroughsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
