import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

export function ApiBlobUploadWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Handle Azure Blob Storage upload events',
      description: 'Webhook endpoint that receives events when files are uploaded to Azure Blob Storage. Automatically processes video files by converting them to audio.',
    }),
    ApiBody({
      description: 'Array of Azure Event Grid blob events',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            eventType: {
              type: 'string',
              example: 'Microsoft.Storage.BlobCreated',
            },
            subject: {
              type: 'string',
              example: '/blobServices/default/containers/mycontainer/blobs/video.mp4',
            },
            eventTime: {
              type: 'string',
              example: '2023-01-01T12:00:00Z',
            },
            data: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  example: 'https://mystorage.blob.core.windows.net/container/video.mp4',
                },
                contentType: {
                  type: 'string',
                  example: 'video/mp4',
                },
                contentLength: {
                  type: 'number',
                  example: 15728640,
                },
                blobType: {
                  type: 'string',
                  example: 'BlockBlob',
                },
                eTag: {
                  type: 'string',
                  example: '"0x8D9F9C9A9E1F9F0"',
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Events processed successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Events processed successfully',
          },
          processedCount: {
            type: 'number',
            example: 2,
            description: 'Number of video files processed',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid request body or malformed events',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error during video processing',
    }),
  );
}
