/**
 * rules-engine.processor.ts — BullMQ processor for EVALUATE_SESSION jobs.
 *
 * This is the most safety-critical file in the backend.
 * Each job evaluates the current session state against the relevant rule(s)
 * and emits AlertEvents + triggers notifications as needed.
 *
 * INVARIANTS:
 *   1. A job must never throw without being retried (uses BullMQ backoff).
 *   2. Each rule is idempotent: calling it twice for the same state yields the same result.
 *   3. AlertEvents are append-only; rules never modify existing alerts.
 *   4. Rules operate on the data snapshot in the job payload — no side effects on session.
 */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { CheckInRule } from './rules/checkin.rule';
import { SafeRideRule } from './rules/saferide.rule';
import { WalkAloneRule } from './rules/walkalone.rule';
import { SOSRule } from './rules/sos.rule';
import { RULES_ENGINE_QUEUE } from './rules-engine.constants';
import type {
  EvaluateSessionJob,
  CheckInRulePayload,
  SafeRideRulePayload,
  WalkAloneRulePayload,
  SOSRulePayload,
} from './types';

@Processor(RULES_ENGINE_QUEUE, {
  concurrency: 10,
  limiter: { max: 100, duration: 1000 }, // max 100 evaluations/sec
})
export class RulesEngineProcessor extends WorkerHost {
  private readonly logger = new Logger(RulesEngineProcessor.name);

  constructor(
    private readonly checkInRule: CheckInRule,
    private readonly safeRideRule: SafeRideRule,
    private readonly walkAloneRule: WalkAloneRule,
    private readonly sosRule: SOSRule,
  ) {
    super();
  }

  async process(job: Job<EvaluateSessionJob>): Promise<void> {
    const { sessionId, sessionType, payload } = job.data;
    this.logger.debug(`Evaluating session ${sessionId} (${sessionType})`);

    try {
      switch (sessionType) {
        case 'CHECKIN':
          await this.checkInRule.evaluate(sessionId, payload as CheckInRulePayload);
          break;
        case 'SAFERIDE':
          await this.safeRideRule.evaluate(sessionId, payload as SafeRideRulePayload);
          break;
        case 'WALKALONE':
          await this.walkAloneRule.evaluate(sessionId, payload as WalkAloneRulePayload);
          break;
        case 'SOS':
          await this.sosRule.evaluate(sessionId, payload as SOSRulePayload);
          break;
        default: {
          const exhaustive: never = sessionType;
          this.logger.error(`Unknown session type: ${String(exhaustive)}`);
        }
      }
    } catch (err) {
      this.logger.error(`Rules engine error for session ${sessionId}`, err);
      throw err; // re-throw for BullMQ retry
    }
  }
}
