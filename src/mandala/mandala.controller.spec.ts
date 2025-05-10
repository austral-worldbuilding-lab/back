import { Test, TestingModule } from '@nestjs/testing';
import { MandalaController } from './mandala.controller';
import { MandalaService } from './mandala.service';

describe('MandalaController', () => {
  let controller: MandalaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MandalaController],
      providers: [MandalaService],
    }).compile();

    controller = module.get<MandalaController>(MandalaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
