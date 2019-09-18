// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as actions from './actions';
import chromeAsync from './chromeasync';

/**
 * Subscribes to the store. On config update, write it to the Chrome storage.
 * @param {Store} store - Redux store to be subscribed.
 */
const subscribe = (store) => {
  let lastConfig = null;
  store.subscribe(() => {
    const { config } = store.getState();
    if (config !== lastConfig) {
      lastConfig = config;
      chromeAsync.storage.sync.set(config);
    }
  });
};

/**
 * Initializes the persistence of the config data.
 * Loads the store data from the Chrome storage. Also, subscribe to the store
 * to save the config whenever updated.
 * @param {Store} store - Redux store for the application.
 * @returns {Promise<undefined>} Resolved when the data is loaded and
 *     subscription is done.
 */
export const init = async (store) => {
  const config = await chromeAsync.storage.sync.get(null);
  store.dispatch(actions.updateConfig(config));
  subscribe(store);
};
