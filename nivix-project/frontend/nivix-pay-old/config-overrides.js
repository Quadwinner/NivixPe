const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify"),
    "url": require.resolve("url"),
    "process": require.resolve("process/browser.js")
  });
  config.resolve.fallback = fallback;

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    })
  ]);

  // Resolve process/browser issue for ESM modules
  config.resolve.alias = {
    ...config.resolve.alias,
    'process/browser': require.resolve('process/browser.js')
  };

  // Add PostCSS loader for Tailwind CSS
  const oneOf = config.module.rules.find(rule => rule.oneOf);
  if (oneOf) {
    const cssRule = oneOf.oneOf.find(
      rule => rule.test && rule.test.toString().includes('css')
    );
    if (cssRule) {
      cssRule.use = cssRule.use || [];
      // Ensure postcss-loader is included
      if (!cssRule.use.some(loader =>
        typeof loader === 'object' && loader.loader && loader.loader.includes('postcss-loader')
      )) {
        const styleLoaderIndex = cssRule.use.findIndex(loader =>
          typeof loader === 'string' && loader.includes('style-loader') ||
          typeof loader === 'object' && loader.loader && loader.loader.includes('style-loader')
        );
        if (styleLoaderIndex !== -1) {
          cssRule.use.splice(styleLoaderIndex + 2, 0, {
            loader: require.resolve('postcss-loader'),
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            },
          });
        }
      }
    }
  }
  // Ignore source map warnings from node_modules
  config.ignoreWarnings = [/Failed to parse source map/];

  // Disable source-map-loader for node_modules to avoid TypeScript version conflicts
  config.module.rules = config.module.rules.map(rule => {
    if (rule.oneOf) {
      rule.oneOf = rule.oneOf.map(oneOfRule => {
        if (oneOfRule.loader && oneOfRule.loader.includes('source-map-loader')) {
          return {
            ...oneOfRule,
            exclude: /node_modules/
          };
        }
        return oneOfRule;
      });
    }
    return rule;
  });

  return config;
}; 