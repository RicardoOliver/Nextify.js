import { describe, expect, it } from 'vitest';
import { PluginSystem } from '../src/plugins/pluginSystem.js';
import { getOfficialPlugins } from '../src/plugins/officialPlugins.js';

describe('official plugins', () => {
  it('registra plugins oficiais no lifecycle', () => {
    const pluginSystem = new PluginSystem();
    const plugins = getOfficialPlugins();

    pluginSystem.use(plugins.authPlugin());
    pluginSystem.use(plugins.seoPlugin());
    pluginSystem.use(plugins.analyticsPlugin());
    pluginSystem.use(plugins.cachePlugin());
    pluginSystem.use(plugins.i18nPlugin());

    expect(() => pluginSystem.runHook('beforeRequest')).not.toThrow();
    expect(() => pluginSystem.runHook('afterResponse')).not.toThrow();
  });
});
