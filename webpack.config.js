const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Ensure React Native resolves to react-native-web for web builds
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'react-native$': 'react-native-web',
    'expo/config': '@expo/config',
    '@react-navigation/elements/lib/module/useFrameSize.js': path.resolve(__dirname, 'src/shims/useFrameSize.web.js'),
  };

  // Disable PWA manifest generation to avoid expo-pwa resolution issues
  // Filters out possible manifest plugins used by @expo/webpack-config
  config.plugins = (config.plugins || []).filter((p) => {
    const name = p && p.constructor && p.constructor.name;
    return (
      name !== 'WebpackPWAManifestPlugin' &&
      name !== 'PwaManifestPlugin' &&
      name !== 'ExpoPwaManifestPlugin'
    );
  });

  // Replace problematic ESM module with local shim to avoid `require` usage
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /useFrameSize(\.js)?$/, 
      path.resolve(__dirname, 'src/shims/useFrameSize.web.js')
    )
  );

  // Ensure EXPO_PUBLIC_* env vars are available in the browser bundle
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.EXPO_PUBLIC_SUPABASE_URL': JSON.stringify(process.env.EXPO_PUBLIC_SUPABASE_URL || ''),
      'process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''),
      'process.env.EXPO_PUBLIC_DEV_USER_ID': JSON.stringify(process.env.EXPO_PUBLIC_DEV_USER_ID || ''),
    })
  );

  return config;
};