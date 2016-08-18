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

/**
 * Wraps a chrome API, which takes the callback with an argument at the last
 * argument, and returns a function returning the Promise instance.
 * Returned promise will be resolved if the wrapped API succeeds (i.e.
 * chrome.runtime.lastError is not set). Otherwise, rejected with
 * chrome.runtime.lastError value.
 * Example usage:
 *   var asyncApi = promisify(chrome.storage.sync, 'get');
 *   asyncApi().then((result) => { ... });
 *
 * @private
 * @param {object} thisArg - Object that holds the API.
 *     E.g. chrome.storage.sync.
 * @param {string} name - The API name.
 * @return {function(...)} Function which returns a Promise instance wrapping
 *     the given chrome API.
 */
function promisify(thisArg, name) {
  const api = thisArg[name];
  return (...args) => new Promise((resolve, reject) => {
    api.call(thisArg, ...args, function(result) {
      if (chrome.runtime.lastError) {
        // Fail.
        reject(chrome.runtime.lastError);
        return;
      }
      // Success.
      resolve(result);
    });
  });
}

/**
 * Wraps only APIs that are used in Stijl.
 * @const
 */
const chromeAsync = {
  permissions: {
    request: promisify(chrome.permissions, 'request'),
    contains: promisify(chrome.permissions, 'contains'),
    remove: promisify(chrome.permissions, 'remove'),
  },

  storage: {
    sync: {
      get: promisify(chrome.storage.sync, 'get'),
      set: promisify(chrome.storage.sync, 'set'),
    },
  },

  tabs: {
    create: promisify(chrome.tabs, 'create'),
    get: promisify(chrome.tabs, 'get'),
  },
};

export default chromeAsync;
