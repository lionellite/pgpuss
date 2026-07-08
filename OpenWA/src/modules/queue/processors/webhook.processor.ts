import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createLogger } from '../../../common/services/logger.service';
import { QUEUE_NAMES } from '../queue-names';
import { WebhookJobData } from '../../webhook/webhook.service';
import { Webhook } from '../../webhook/entities/webhook.entity';
import { HookManager } from '../../../core/hooks';

export interface WebhookJobResult {
  statusCode: number;
  success: boolean;
  error?: string;
  responseTime: number;
}

@Processor(QUEUE_NAMES.WEBHOOK)
export class WebhookProcessor extends WorkerHost {
  private readonly logger = createLogger('WebhookProcessor');

  constructor(
    @InjectRepository(Webhook, 'data')
    private readonly webhookRepository: Repository<Webhook>,
    private readonly hookManager: HookManager,
  ) {
    super();
  }

  async process(job: Job<WebhookJobData>): Promise<WebhookJobResult> {
    const { webhookId, url, event, payload, headers, maxRetries } = job.data;
    const startTime = Date.now();
    const sessionId = payload.sessionId;

    // Sanitize the URL
    let sanitizedUrl = url;
    sanitizedUrl = sanitizedUrl.trim();
    sanitizedUrl = sanitizedUrl.replace(/^(`|'|")+/, '');
    sanitizedUrl = sanitizedUrl.replace(/(`|'|")+$/, '');

    this.logger.log(`⚙️ Processing webhook job ${job.id} for event ${event}`, {
      webhookId,
      originalUrl: url,
      sanitizedUrl,
      event,
      deliveryId: payload.deliveryId,
      idempotencyKey: payload.idempotencyKey,
      attempt: job.attemptsMade + 1,
      maxRetries,
      action: 'webhook_process_start',
    });

    // Update retry count in headers
    const requestHeaders = {
      ...headers,
      'X-OpenWA-Retry-Count': String(job.attemptsMade),
    };

    try {
      const response = await fetch(sanitizedUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      // Log full response details to see what's happening
      const responseText = await response.text();
      this.logger.log(`📋 Webhook response received`, {
        webhookId,
        url: sanitizedUrl,
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText.substring(0, 500), // Log first 500 chars to avoid huge logs
        action: 'webhook_response',
      });

      const responseTime = Date.now() - startTime;
      const success = response.ok;

      if (!success) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
      }

      // Update lastTriggeredAt on successful delivery
      await this.webhookRepository.update(webhookId, {
        lastTriggeredAt: new Date(),
      });

      // Execute hook after successful delivery
      await this.hookManager.execute(
        'webhook:delivered',
        {
          sessionId,
          event,
          webhookId,
          deliveryId: payload.deliveryId,
          statusCode: response.status,
          responseTime,
          attempt: job.attemptsMade + 1,
        },
        { sessionId, source: 'WebhookProcessor' },
      );

      this.logger.log(`✅ Webhook delivered successfully to ${sanitizedUrl}`, {
        webhookId,
        event,
        deliveryId: payload.deliveryId,
        idempotencyKey: payload.idempotencyKey,
        statusCode: response.status,
        responseTime,
        attempt: job.attemptsMade + 1,
        action: 'webhook_delivered',
      });

      return {
        statusCode: response.status,
        success: true,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isFinalAttempt = job.attemptsMade + 1 >= maxRetries;

      this.logger.error(`Webhook delivery failed`, errorMessage, {
        webhookId,
        event,
        deliveryId: payload.deliveryId,
        idempotencyKey: payload.idempotencyKey,
        responseTime,
        attempt: job.attemptsMade + 1,
        maxRetries,
        isFinalAttempt,
        action: 'webhook_failed',
      });

      // Execute error hook only on final failure (all retries exhausted)
      if (isFinalAttempt) {
        await this.hookManager.execute(
          'webhook:error',
          {
            sessionId,
            event,
            webhookId,
            deliveryId: payload.deliveryId,
            error: errorMessage,
            attempt: job.attemptsMade + 1,
          },
          { sessionId, source: 'WebhookProcessor' },
        );
      }

      // Re-throw to trigger BullMQ retry
      throw error;
    }
  }
}
