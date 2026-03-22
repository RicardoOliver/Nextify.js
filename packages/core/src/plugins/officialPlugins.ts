import type { NextifyPlugin } from './pluginSystem.js';

type PluginFactory = (options?: Record<string, unknown>) => NextifyPlugin;

function withName(name: string, setup: NextifyPlugin['setup']): NextifyPlugin {
  return { name, setup };
}

export const authPlugin: PluginFactory = (options = {}) =>
  withName('official-auth', ({ registerHook }) => {
    registerHook('beforeRequest', () => {
      void options.providers;
    });
  });

export const seoPlugin: PluginFactory = (options = {}) =>
  withName('official-seo', ({ registerHook }) => {
    registerHook('afterResponse', () => {
      void options.defaultMeta;
    });
  });

export const analyticsPlugin: PluginFactory = (options = {}) =>
  withName('official-analytics', ({ registerHook }) => {
    registerHook('afterResponse', () => {
      void options.provider;
    });
  });

export const cachePlugin: PluginFactory = (options = {}) =>
  withName('official-cache', ({ registerHook }) => {
    registerHook('beforeRequest', () => {
      void options.strategy;
    });
  });

export const i18nPlugin: PluginFactory = (options = {}) =>
  withName('official-i18n', ({ registerHook }) => {
    registerHook('beforeRequest', () => {
      void options.locales;
    });
  });

export function getOfficialPlugins() {
  return {
    authPlugin,
    seoPlugin,
    analyticsPlugin,
    cachePlugin,
    i18nPlugin
  };
}
