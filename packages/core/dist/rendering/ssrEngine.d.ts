import React from 'react';
import type { ServerResponse } from 'node:http';
export type SSRStreamOptions = {
    statusCode?: number;
    headers?: Record<string, string>;
    shellTimeoutMs?: number;
    bootstrapScripts?: string[];
    nonce?: string;
    onShellReady?: () => void;
    onAllReady?: () => void;
    onError?: (error: unknown) => void;
};
export declare function streamSSR(element: React.ReactElement, res: ServerResponse, options?: SSRStreamOptions): void;
