const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.extraNodeModules = {
  '@jobready/core': path.resolve(workspaceRoot, 'NS_JR_Core_TS/src/index.ts')
};
config.resolver.assetExts.push('txt');

module.exports = config;
