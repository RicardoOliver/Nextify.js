import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { streamSSR } from '../src/rendering/ssrEngine.js';

const renderToPipeableStreamMock = vi.hoisted(() => vi.fn());

vi.mock('react-dom/server', () => ({
  renderToPipeableStream: renderToPipeableStreamMock
}));

type MockResponse = EventEmitter & {
  statusCode: number;
  headersSent: boolean;
  writableEnded: boolean;
  setHeader: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
};

function createMockResponse(): MockResponse {
  const res = new EventEmitter() as MockResponse;
  res.statusCode = 200;
  res.headersSent = false;
  res.writableEnded = false;
  res.setHeader = vi.fn(() => {
    res.headersSent = true;
  });
  res.end = vi.fn(() => {
    res.writableEnded = true;
    res.emit('finish');
  });
  return res;
}

describe('streamSSR', () => {
  beforeEach(() => {
    renderToPipeableStreamMock.mockReset();
  });

  it('aplica status, headers e inicia stream no shell ready', () => {
    const res = createMockResponse();
    const pipe = vi.fn();

    renderToPipeableStreamMock.mockImplementation((_element, callbacks) => {
      callbacks.onShellReady();
      return { pipe, abort: vi.fn() };
    });

    streamSSR({} as never, res as never, {
      statusCode: 202,
      headers: { 'x-nextify': 'streaming' }
    });

    expect(res.statusCode).toBe(202);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
    expect(res.setHeader).toHaveBeenCalledWith('x-nextify', 'streaming');
    expect(pipe).toHaveBeenCalledWith(res);
  });

  it('encerra com timeout e aborta stream quando shell não fica pronto', () => {
    vi.useFakeTimers();
    const res = createMockResponse();
    const abort = vi.fn();

    renderToPipeableStreamMock.mockReturnValue({
      pipe: vi.fn(),
      abort
    });

    streamSSR({} as never, res as never, { shellTimeoutMs: 5 });
    vi.advanceTimersByTime(10);

    expect(abort).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(504);
    expect(res.end).toHaveBeenCalledWith(expect.stringContaining('SSR Timeout'));

    vi.useRealTimers();
  });

  it('escapa erro de renderização antes de enviar headers', () => {
    const res = createMockResponse();

    renderToPipeableStreamMock.mockImplementation((_element, callbacks) => {
      callbacks.onError(new Error('<script>alert(1)</script>'));
      return { pipe: vi.fn(), abort: vi.fn() };
    });

    streamSSR({} as never, res as never);

    expect(res.statusCode).toBe(500);
    const body = res.end.mock.calls[0][0] as string;
    expect(body).not.toContain('<script>alert(1)</script>');
    expect(body).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
