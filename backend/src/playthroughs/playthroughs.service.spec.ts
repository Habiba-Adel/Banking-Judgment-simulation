import { Test, TestingModule } from '@nestjs/testing';
import { PlaythroughsService } from './playthroughs.service';

describe('PlaythroughsService', () => {
  let service: PlaythroughsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlaythroughsService],
    }).compile();

    service = module.get<PlaythroughsService>(PlaythroughsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
