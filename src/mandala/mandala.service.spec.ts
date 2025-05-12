import { Test, TestingModule } from '@nestjs/testing';
import { MandalaService } from './mandala.service';

describe('MandalaService', () => {
  let service: MandalaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MandalaService],
    }).compile();

    service = module.get<MandalaService>(MandalaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
