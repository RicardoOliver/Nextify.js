import { describe, expect, it } from 'vitest';
import { PluginSystem } from '../src/plugins/pluginSystem';

describe('PluginSystem', () => {
  it('registra e executa hooks válidos', () => {
    const runtime = new PluginSystem();
    const trace: string[] = [];

    runtime.use({
      name: 'logger',
      setup: ({ registerHook }) => {
        registerHook('beforeRequest', () => trace.push('before'));
        registerHook('afterResponse', () => trace.push('after'));
      }
    });

    runtime.runHook('beforeRequest');
    runtime.runHook('afterResponse');

    expect(trace).toEqual(['before', 'after']);
  });

  it('bloqueia plugin duplicado', () => {
    const runtime = new PluginSystem();

    runtime.use({
      name: 'dupe',
      setup: () => {}
    });

    expect(() =>
      runtime.use({
        name: 'dupe',
        setup: () => {}
      })
    ).toThrow('Plugin duplicado: dupe');
  });

  it('bloqueia hook inválido e excesso de hooks por plugin', () => {
    const runtime = new PluginSystem({ maxHooksPerPlugin: 1 });

    expect(() =>
      runtime.use({
        name: 'invalid',
        setup: ({ registerHook }) => {
          registerHook('beforeRequest', () => {});
          registerHook('buildEnd', () => {});
        }
      })
    ).toThrow('Plugin invalid excedeu limite de hooks (1)');

    expect(() =>
      runtime.use({
        name: 'bad-hook',
        setup: ({ registerHook }) => {
          registerHook('not-exists' as never, () => {});
        }
      })
    ).toThrow('Hook inválido: not-exists');
  });
});
