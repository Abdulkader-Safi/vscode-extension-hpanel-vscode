export class HostingerApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;

  constructor(init: {
    message: string;
    status: number;
    code?: string;
    requestId?: string;
    retryable?: boolean;
    retryAfterMs?: number;
  }) {
    super(init.message);
    this.name = "HostingerApiError";
    this.status = init.status;
    this.code = init.code;
    this.requestId = init.requestId;
    this.retryable =
      init.retryable ?? (init.status === 429 || init.status >= 500);
    this.retryAfterMs = init.retryAfterMs;
  }
}

export function isHostingerApiError(err: unknown): err is HostingerApiError {
  return err instanceof HostingerApiError;
}
