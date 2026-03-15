declare module '@nextify/dev-server' {
  export function startDevServer(options?: {
    root?: string;
    port?: number;
  }): Promise<void>;
}