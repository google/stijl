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

import chromeAsync from './chromeasync';

/**
 * @param {{url: string}} site - URL.
 * @return {string} The origin of the given site.
 */
const getOrigin = (site) => {
  const a = document.createElement('a');
  a.href = site.url;
  return a.origin + '/';
};

/**
 * @param {function(Permissions): Promise<boolean>} api - Promisified chrome
 *     permission API. See also chromeasync module.
 *     The wrapped API needs to take a callback whose argument is bool
 *     representing success or fail.
 * @param {{url: string}[]} sites - Array of site objects.
 * @returns {Promise<undefined>} Resolved on success, or rejected on fail.
 */
const wrapChromeApi = async (api, sites) => {
  const result = await api({origins: sites.map(getOrigin)});
  if (!result) {
    throw new Error('Failed');
  }
};

/**
 * Requests the permission to access the sites.
 * @param {{url: string}[]} sites - Array of site objects.
 * @return {Promise<undefined>} Resolved if the permission is successfully
 *     granted. Otherwise rejected.
 */
export const request = (sites) => {
  return wrapChromeApi(chromeAsync.permissions.request, sites);
};

/**
 * Checks if the permission to access the sites is granted.
 * @param {{url: string}[]} sites - Array of site objects.
 * @return {Promise<undefined>} Resolved if the extension has the permission.
 *     Otherwise rejected.
 */
export const check = (sites) => {
  return wrapChromeApi(chromeAsync.permissions.contains, sites);
};

/**
 * Revokes the permission to access the sites.
 * @param {{url: string}[]} sites - Array of site objects.
 * @return {Promise<undefined>} Resolved if the permission is already granted.
 *     Otherwise rejected.
 */
export const revoke = (sites) => {
  return wrapChromeApi(chromeAsync.permissions.remove, sites);
};
