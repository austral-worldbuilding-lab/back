import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiBlobUploadWebhook } from '../decorators/webhook-swagger.decorators';
import { VideoProcessingService } from '../services/video-processing.service';
import { AppLogger } from '@common/services/logger.service';

interface AzureBlobEvent {
  eventType: string;
  subject: string;
  eventTime: string;
  data: {
    url: string;
    contentType: string;
    contentLength: number;
    blobType: string;
    eTag: string;
  };
}

interface AzureValidationEvent {
  eventType: 'Microsoft.EventGrid.SubscriptionValidationEvent';
  subject: string;
  eventTime: string;
  data: {
    validationCode: string;
    validationUrl: string;
  };
}

interface AzureValidationResponse {
  validationResponse: string;
}

type AzureEventGridEvent = AzureBlobEvent | AzureValidationEvent;

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {

  constructor(
    private readonly videoProcessingService: VideoProcessingService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(WebhooksController.name);
  }

  @Post('blob-upload')
  @HttpCode(200)
  @ApiBlobUploadWebhook()
  async handleBlobUpload(
    @Body() events: AzureEventGridEvent[],
  ): Promise<
    { message: string; processedCount: number } | AzureValidationResponse
  > {
    this.logger.log(`Received ${events.length} events from Azure Event Grid`);

    // Handle subscription validation handshake
    if (
      events.length > 0 &&
      events[0].eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent'
    ) {
      const validationEvent = events[0] as AzureValidationEvent;
      const validationCode = validationEvent.data.validationCode;

      this.logger.log(
        'Received subscription validation event, responding with validation code',
      );
      return { validationResponse: validationCode };
    }

    let processedCount = 0;

    for (const event of events) {
      try {
        // Only process blob creation events
        if (event.eventType !== 'Microsoft.Storage.BlobCreated') {
          this.logger.debug(`Ignoring event type: ${event.eventType}`);
          continue;
        }

        const blobEvent = event;
        const { url, contentType } = blobEvent.data;
        const fileName = this.extractFileName(url);

        this.logger.log(`Processing file: ${fileName} (${contentType})`);

        // Check if it's a video file
        if (this.isVideoFile(contentType)) {
          this.logger.log(
            `Video file detected: ${fileName}, starting conversion...`,
          );

          // Process video to audio conversion
          await this.videoProcessingService.processVideoFile(url, fileName);
          processedCount++;

          this.logger.log(`✅ Successfully processed video: ${fileName}`);
        } else {
          this.logger.debug(
            `Skipping non-video file: ${fileName} (${contentType})`,
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.error(`Failed to process event: ${errorMessage}`, {
          eventType: event.eventType,
          url:
            event.eventType === 'Microsoft.Storage.BlobCreated'
              ? event.data.url
              : 'N/A',
          error: errorStack,
        });
        // Continue processing other events even if one fails
      }
    }

    const response = {
      message: 'Events processed successfully',
      processedCount,
    };

    this.logger.log(
      `Webhook processing completed: ${processedCount} videos processed`,
    );
    return response;
  }

  private extractFileName(url: string): string {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  }

  private isVideoFile(contentType: string): boolean {
    const videoTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm',
      'video/mkv',
      'video/m4v',
      'video/3gp',
      'video/quicktime',
    ];

    return videoTypes.includes(contentType.toLowerCase());
  }
}
