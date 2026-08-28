# BullMQ Infrastructure Review

## Scope

This review covers the BullMQ and Redis infrastructure currently present in the OrderFlow backend:

- BullMQ bootstrap and default job options in `src/common/queue/queue.module.ts`
- Queue registration and Bull Board integration in `src/common/email/email.module.ts`
- Email job production in `src/common/email/email.queue.service.ts`
- Email job processing in `src/common/email/email.processor.ts`
- Shared worker event logging in `src/common/queue/base.processor.service.ts`
- Redis configuration and lifecycle in `src/common/redis/redis.service.ts`
- Local container deployment in `compose.yml` and `Dockerfile`

The review is based on the repository state on 2026-08-28. It is a code and configuration review; runtime load, failure-injection, and production security testing were not performed.

## Current Architecture

BullMQ is initialized globally with the Redis URL from `REDIS_URL`. The application currently runs the API, BullMQ worker, and scheduled jobs in the same NestJS process. The email module registers one queue named `email`, exposes it through Bull Board, and provides an `EmailQueueService` that adds `send-email` jobs. `EmailProcessor` consumes those jobs and calls Resend through `EmailService`.

The queue defaults are:

- Three attempts per job
- Exponential backoff starting at five seconds
- Completed jobs removed automatically
- Failed jobs removed automatically

Redis is also used directly by a separate `ioredis` client for application caching and authentication data. The Docker Compose Redis service enables AOF persistence and has a health check.

## What Is Good

### Clear separation of responsibilities

Queue setup, queue naming, job production, processing, and shared worker logging are separated into focused modules. Callers do not need to know BullMQ details; they depend on `EmailQueueService`.

### Asynchronous email delivery

Email sending is moved out of the request path. This reduces request latency and prevents a slow or temporarily unavailable email provider from directly blocking authentication flows.

### Centralized retry policy

The global defaults provide retries and exponential backoff without requiring every producer to repeat the configuration. This is a sensible baseline for transient provider failures.

### Shared worker event handling

`BaseProcessor` gives processors a common place to observe active, completed, failed, and stalled jobs. Stalled-job logging is particularly useful because it can reveal worker crashes, event-loop blocking, or insufficient lock duration.

### Redis persistence in local Compose

Redis uses a named persistent volume and AOF mode. The Redis health check and `depends_on` health condition also improve local startup ordering.

### Operational visibility exists

Bull Board is integrated and the email queue is registered with it. This gives operators a useful starting point for inspecting queue state during development and controlled operations.

### Environment validation

`REDIS_URL` is required and validated at startup. This avoids silently starting the queue against an undefined or malformed connection setting.

## Issues and Risks

Severity reflects the likely production impact, not merely code-style preference.

### High: Bull Board is excluded from authentication

The application explicitly excludes `/queues` and `/queues/{*path}` from the global access-token guard. Bull Board is therefore not protected by the application authentication layer shown in this repository. Depending on network exposure and any external proxy controls, an unauthenticated user may be able to inspect queue names, job metadata, failures, and operational state, and may have dashboard actions available.

**What could be done better:** Put Bull Board behind dedicated administrator authentication and authorization, or bind it to an internal network/admin endpoint. Add rate limiting and audit logging where the dashboard is exposed. Treat queue payloads as sensitive because email jobs contain recipient addresses, subjects, templates, and context.

### High: Failed jobs are deleted immediately

`removeOnFail: true` removes failed jobs after failure. This prevents the dashboard and operators from inspecting failed payloads, stack traces, attempt counts, or failure patterns. It also removes the natural source for replaying a failed job.

**What could be done better:** Retain failed jobs for a bounded period and/or bounded count, such as a short operational window plus a dead-letter workflow. Define who can replay or remove them. Retention should be balanced against PII, storage, and compliance requirements.

### High: Retry policy can duplicate email delivery

The processor calls an external side effect, Resend, and the generic retry policy retries any thrown error. If Resend accepts the message but the process loses the response, the retry can send the same email again. The current job has no explicit idempotency key or provider message correlation strategy.

**What could be done better:** Assign a stable business/event id to each logical email, persist delivery state, and make processing idempotent. Classify errors so permanent validation/provider errors are not retried, while transient errors are retried. Where supported, pass an idempotency key to the provider or deduplicate before sending.

### High: API and worker availability are coupled

The API and worker run in the same process and the Docker image starts one application command. A worker crash, memory spike, blocked event loop, or provider-related workload can affect API traffic. Scaling the API also scales workers and may create unnecessary queue consumers.

**What could be done better:** Support separate API and worker deployment roles using the same application image with different startup commands or bootstrap paths. Scale workers independently and set worker concurrency based on provider limits and measured throughput. Keep scheduled jobs in an explicitly chosen role to avoid duplicate schedulers when replicas increase.

### Medium: Queue and job identity are weakly defined

The queue name is centralized, but the job name `send-email` and job payload have no version, correlation id, tenant/order reference, or explicit job id. The `INVOICE` queue constant is present but has no registration, producer, or processor, which can mislead operators and future developers.

**What could be done better:** Define typed job-name and payload contracts per queue. Include a correlation/event id and schema version. Use deterministic job ids when duplicate enqueueing must be prevented. Remove unused queue names until implemented, or document them as reserved and add registration tests when they become active.

### Medium: No queue-specific operational controls are configured

The email queue has no explicit concurrency, rate limiter, timeout, priority policy, or queue-specific backoff. Global defaults are convenient, but email delivery has external provider quotas and different failure characteristics from future invoice or order work.

**What could be done better:** Configure each queue according to its workload. Set concurrency and provider rate limits, define job timeouts, and use queue-specific retry/backoff policies. Add a policy for jobs that exhaust retries, including alerting and replay handling.

### Medium: Observability is too thin for incident diagnosis

Worker logs contain the job name, and some events contain a job id, but they do not consistently include queue name, job id, attempt number, correlation id, duration, or structured error/provider information. There are no visible metrics or alerts for queue depth, oldest waiting job, failure rate, retry rate, stalled jobs, or worker health.

**What could be done better:** Emit structured logs with queue, job, attempt, correlation, and duration fields. Publish metrics and alerts for backlog age, failed/stalled jobs, retry exhaustion, and Redis connectivity. Avoid logging full email context or other sensitive payload data.

### Medium: Redis is a shared dependency without an explicit failure strategy

BullMQ and application caching both depend on Redis, but they use separate client layers and there is no documented policy for Redis outages. A Redis failure can affect queue operation, authentication throttling, tokens, and cache reads at the same time. The direct Redis client logs errors and throws, while queue behavior is delegated to BullMQ defaults.

**What could be done better:** Document which features fail closed, fail open, or degrade during Redis loss. Configure production Redis security and TLS through the connection URL/options where required. Add startup/readiness checks and alerts that distinguish queue connectivity from cache connectivity. Consider deliberate connection settings and bounded shutdown timeouts.

### Low: Queue lifecycle and shutdown behavior are implicit

Nest shutdown hooks are enabled, and the custom Redis service closes its own client. Worker shutdown is left to framework integration, with no documented drain timeout or handling for jobs in progress during termination.

**What could be done better:** Verify and document graceful worker shutdown: stop accepting jobs, allow an appropriate processing window, then close connections. Test container termination and rolling deployments to confirm jobs are not abandoned or duplicated unexpectedly.

### Low: No focused BullMQ tests are visible

There are no tests under `src/common/queue`. The queue producer, retry assumptions, processor behavior, shutdown handling, and dashboard protection therefore have no local regression net in the reviewed area.

**What could be done better:** Add focused tests for job creation, payload validation, processor success/failure behavior, retry classification, idempotency, and access control around Bull Board. Add an integration test against Redis for the lifecycle and retention policy.

## Recommended Improvement Order

1. Protect Bull Board and confirm it is not publicly reachable through deployment ingress.
2. Change failed-job retention from immediate deletion to an explicit retention/dead-letter policy, taking PII into account.
3. Design idempotent email delivery before increasing retry usage or adding more externally visible jobs.
4. Add queue metrics, structured worker logs, and alerts for backlog age, failures, retries, stalls, and Redis health.
5. Separate API, worker, and scheduler deployment roles so each can scale and restart independently.
6. Add queue-specific concurrency, rate limits, timeouts, and retry classification.
7. Define typed, versioned job contracts and correlation identifiers; resolve or document the unused invoice queue constant.
8. Test graceful shutdown, Redis outage behavior, duplicate enqueueing, provider timeouts, and rolling deployment termination.

## Target-State Checklist

- [ ] Bull Board is administrator-only and isolated from public traffic.
- [ ] Failed jobs have bounded retention and a controlled replay/dead-letter process.
- [ ] Email jobs are idempotent and carry a correlation/event id.
- [ ] Permanent and transient failures have different retry behavior.
- [ ] Queue depth, oldest-job age, failure rate, stalls, and retry exhaustion are observable.
- [ ] API, workers, and schedulers can be deployed and scaled independently.
- [ ] Queue-specific concurrency, limits, timeouts, and retention are documented.
- [ ] Redis outage and graceful-shutdown behavior are tested.
- [ ] Focused queue and worker tests cover the operational contract.

## Overall Assessment

The current BullMQ foundation is small, understandable, and appropriate for asynchronous email delivery in an early-stage backend. Its central setup, retry baseline, worker event hooks, and persistent local Redis setup are good starting points. The main gap is production operations: the dashboard access boundary, failure retention, external-side-effect idempotency, and observability need deliberate policies before the queue handles higher-value or higher-volume work. The architecture should also make worker and API roles independently deployable before queue volume grows.
