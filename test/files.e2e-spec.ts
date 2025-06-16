/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { ProjectParticipantGuard } from '@modules/mandala/guards/project-participant.guard';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

describe('Files module (DELETE)', () => {
  let app: INestApplication;
  const account = process.env.AZURE_STORAGE_ACCOUNT!;
  const accountKey = process.env.AZURE_STORAGE_ACCESS_KEY!;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;
  const projectId = 'e2e_project';
  const fileName = 'e2e_file.txt';
  const pathInContainer = `${projectId}/${fileName}`;

  // Azure SDK client for setup/teardown validations
  const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    new StorageSharedKeyCredential(account, accountKey),
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlockBlobClient(pathInContainer);

  beforeAll(async () => {
    // Pre-create container if needed (primarily in CI environments)
    await containerClient.createIfNotExists();

    // Ensure a clean state (delete if already exists)
    await blobClient.deleteIfExists();
    await blobClient.uploadData(Buffer.from('dummy'));

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          // Inject a fake user id so ProjectParticipantGuard (mocked below) can pick it up if needed
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'user-e2e' };
          return true;
        },
      })
      .overrideGuard(ProjectParticipantGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // Ensure leftover artifacts are removed (in case the test failed before deletion)
    await blobClient.deleteIfExists();
    await app.close();
  });

  it('should delete the blob and return 200', async () => {
    // Call DELETE endpoint
    await request(app.getHttpServer())
      .delete(`/files/${projectId}/${fileName}`)
      .set('Authorization', 'Bearer FAKE') // token is irrelevant – guard mocked
      .expect(200);

    // Validate the blob no longer exists in Azure
    const exists = await blobClient.exists();
    expect(exists).toBe(false);
  });
});
