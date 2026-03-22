import { describe, expect, it } from 'vitest';
import { PluginSystem, SUPPORTED_PLUGIN_API_VERSIONS } from '../src/plugins/pluginSystem.js';

describe('plugin compatibility contract', () => {
  it('aceita plugin legado sem apiVersion (compatibilidade retroativa)', () => {
    const pluginSystem = new PluginSystem();

    expect(() =>
      pluginSystem.use({
        name: 'legacy-plugin',
        setup: ({ registerHook }) => {
          registerHook('beforeRequest', () => {});
        }
      }),
    ).not.toThrow();
  });

  it('aceita versões de API suportadas', () => {
    const pluginSystem = new PluginSystem();

    for (const apiVersion of SUPPORTED_PLUGIN_API_VERSIONS) {
      expect(() =>
        pluginSystem.use({
          name: `plugin-${apiVersion}`,
          apiVersion,
          setup: ({ registerHook }) => {
            registerHook('afterResponse', () => {});
          }
        }),
      ).not.toThrow();
    }
  });

  it('rejeita versões de API não suportadas', () => {
    const pluginSystem = new PluginSystem();

    expect(() =>
      pluginSystem.use({
        name: 'future-plugin',
        apiVersion: '2.x' as never,
        setup: () => {}
      }),
    ).toThrow('Plugin future-plugin usa apiVersion não suportada (2.x). Versões suportadas: 1.x');
  });

  it('rejeita contratos inválidos de plugin', () => {
    const pluginSystem = new PluginSystem();

    expect(() => pluginSystem.use(null as never)).toThrow('Plugin precisa ser um objeto válido');

    expect(() =>
      pluginSystem.use({
        name: 'broken-setup',
        setup: undefined as never
      }),
    ).toThrow('Plugin broken-setup precisa implementar setup(ctx)');

    expect(() =>
      pluginSystem.use({
        name: 'wrong-hook-handler',
        setup: ({ registerHook }) => {
          registerHook('beforeRequest', 'nope' as never);
        }
      }),
    ).toThrow('Hook beforeRequest do plugin wrong-hook-handler precisa ser uma função');
  });
});
