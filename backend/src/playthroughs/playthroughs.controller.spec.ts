import { Test, TestingModule } from '@nestjs/testing';
import { PlaythroughsController } from './playthroughs.controller';

describe('PlaythroughsController', () => {
  let controller: PlaythroughsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaythroughsController],
    }).compile();

    controller = module.get<PlaythroughsController>(PlaythroughsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
