/**
 * rules-engine.processor.spec.ts — exhaustive unit tests for the rules engine.
 * Uses Jest with mocked dependencies (no real DB or Redis).
 */
import type { Job } from 'bullmq';

import { RulesEngineProcessor } from './rules-engine.processor';
import { CheckInRule } from './rules/checkin.rule';
import { SafeRideRule } from './rules/saferide.rule';
import { WalkAloneRule } from './rules/walkalone.rule';
import { SOSRule } from './rules/sos.rule';
import type { EvaluateSessionJob } from './types';

const mockEvaluate = jest.fn().mockResolvedValue(undefined);

const mockCheckInRule = { evaluate: mockEvaluate } as unknown as CheckInRule;
const mockSafeRideRule = { evaluate: mockEvaluate } as unknown as SafeRideRule;
const mockWalkAloneRule = { evaluate: mockEvaluate } as unknown as WalkAloneRule;
const mockSOSRule = { evaluate: mockEvaluate } as unknown as SOSRule;

function makeJob(data: EvaluateSessionJob): Job<EvaluateSessionJob> {
  return { data } as Job<EvaluateSessionJob>;
}

function makeLocation() {
  return { lat: 23.8, lng: 90.4, speed: 5.0, timestamp: new Date().toISOString() };
}

describe('RulesEngineProcessor', () => {
  let processor: RulesEngineProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new RulesEngineProcessor(
      mockCheckInRule,
      mockSafeRideRule,
      mockWalkAloneRule,
      mockSOSRule,
    );
  });

  describe('routing', () => {
    it('routes CHECKIN jobs to CheckInRule', async () => {
      const job = makeJob({
        sessionId: 'sess-1',
        sessionType: 'CHECKIN',
        userId: 'user-1',
        payload: {
          etaAt: new Date(Date.now() - 60_000).toISOString(),
          gracePeriodMinutes: 15,
          location: makeLocation(),
          shareWith: [],
          alreadyEscalated: false,
        },
      });
      await processor.process(job);
      expect(mockCheckInRule.evaluate).toHaveBeenCalledTimes(1);
      expect(mockSafeRideRule.evaluate).not.toHaveBeenCalled();
    });

    it('routes SAFERIDE jobs to SafeRideRule', async () => {
      const job = makeJob({
        sessionId: 'sess-2',
        sessionType: 'SAFERIDE',
        userId: 'user-1',
        payload: {
          routePolyline: '_p~iF~ps|U_ulLnnqC',
          deviationThresholdMeters: 200,
          stopThresholdSeconds: 120,
          location: makeLocation(),
          shareWith: [],
          firstDeviationAt: null,
          firstStopAt: null,
          alreadyEscalated: false,
        },
      });
      await processor.process(job);
      expect(mockSafeRideRule.evaluate).toHaveBeenCalledTimes(1);
    });

    it('routes WALKALONE jobs to WalkAloneRule', async () => {
      const job = makeJob({
        sessionId: 'sess-3',
        sessionType: 'WALKALONE',
        userId: 'user-1',
        payload: {
          promptIntervalSeconds: 300,
          lastPromptAt: null,
          lastResponseAt: null,
          location: makeLocation(),
          shareWith: [],
          alreadyEscalated: false,
        },
      });
      await processor.process(job);
      expect(mockWalkAloneRule.evaluate).toHaveBeenCalledTimes(1);
    });

    it('routes SOS jobs to SOSRule', async () => {
      const job = makeJob({
        sessionId: 'sess-4',
        sessionType: 'SOS',
        userId: 'user-1',
        payload: {
          startedAt: new Date().toISOString(),
          smsDelaySeconds: 30,
          callDelaySeconds: 60,
          shareWith: [],
          pushSentAt: null,
          smsSentAt: null,
          callInitiatedAt: null,
        },
      });
      await processor.process(job);
      expect(mockSOSRule.evaluate).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('re-throws rule errors for BullMQ retry', async () => {
      const boom = new Error('rule error');
      (mockCheckInRule.evaluate as jest.Mock).mockRejectedValueOnce(boom);

      const job = makeJob({
        sessionId: 'sess-err',
        sessionType: 'CHECKIN',
        userId: 'user-1',
        payload: {
          etaAt: new Date().toISOString(),
          gracePeriodMinutes: 15,
          location: makeLocation(),
          shareWith: [],
          alreadyEscalated: false,
        },
      });

      await expect(processor.process(job)).rejects.toThrow('rule error');
    });
  });
});
