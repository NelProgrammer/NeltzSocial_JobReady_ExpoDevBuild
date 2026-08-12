// @ts-nocheck
import * as tslib from 'tslib';
if (tslib && !tslib.default) {
  (tslib as any).default = tslib;
}

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
