import { it, expect, describe } from 'vitest';
import path from 'path';
import {
  getTargetEnvConfig,
  patchWebpackConfig,
  type ConfigType,
} from './utils';

const mfConfig = {
  name: 'host',
  filename: 'remoteEntry.js',
  remotes: {
    remote: 'http://localhost:3000/remoteEntry.js',
  },
  shared: {
    react: { singleton: true, eager: true },
    'react-dom': { singleton: true, eager: true },
  },
};
describe('getTargetEnvConfig', async () => {
  it('getTargetEnvConfig: server', async () => {
    const targetEnvConfig = getTargetEnvConfig(mfConfig, true);

    expect(targetEnvConfig).toStrictEqual({
      async: true,
      dev: false,
      dts: false,
      filename: 'remoteEntry.js',
      library: {
        name: 'host',
        type: 'commonjs-module',
      },
      name: 'host',
      remotes: {
        remote: 'http://localhost:3000/remoteEntry.js',
      },
      runtimePlugins: [
        path.resolve(__dirname, './mfRuntimePlugins/shared-strategy.js'),
        path.resolve(__dirname, './mfRuntimePlugins/inject-node-fetch.js'),
      ],
      shared: {
        react: {
          eager: true,
          singleton: true,
        },
        'react-dom': {
          eager: true,
          singleton: true,
        },
      },
    });
  });

  it('getTargetEnvConfig: client', async () => {
    const targetEnvConfig = getTargetEnvConfig(mfConfig, false);

    expect(targetEnvConfig).toStrictEqual({
      async: true,
      filename: 'remoteEntry.js',
      name: 'host',
      remotes: {
        remote: 'http://localhost:3000/remoteEntry.js',
      },
      runtimePlugins: [
        path.resolve(__dirname, './mfRuntimePlugins/shared-strategy.js'),
      ],
      shared: {
        react: {
          eager: true,
          singleton: true,
        },
        'react-dom': {
          eager: true,
          singleton: true,
        },
      },
    });
  });
});

describe('patchWebpackConfig', async () => {
  it('patchWebpackConfig: server', async () => {
    const bundlerConfig = {
      output: {
        publicPath: 'auto',
      },
    };
    patchWebpackConfig<'webpack'>({
      bundlerConfig,
      isServer: true,
      modernjsConfig: {
        server: {
          ssr: {
            mode: 'stream',
          },
        },
      },
      mfConfig,
    });

    expect(bundlerConfig).toStrictEqual({
      output: {
        publicPath: 'http://localhost:8080/',
      },
    });
  });

  it('patchWebpackConfig: client', async () => {
    const bundlerConfig = {
      output: {
        publicPath: 'auto',
      },
    };
    patchWebpackConfig<'webpack'>({
      bundlerConfig,
      isServer: false,
      modernjsConfig: {
        server: {
          ssr: {
            mode: 'stream',
          },
        },
      },
      mfConfig,
    });

    expect(bundlerConfig).toStrictEqual({
      output: {
        publicPath: 'http://localhost:8080/',
      },
    });
  });
});
