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

const makeChromeCall = (method, sites) => {
  return new Promise((resolve, reject) => {
    const origins = sites.map((site) => {
      const a = document.createElement('a');
      a.href = site['url'];
      return a.origin + '/';
    });
    method({origins: origins}, (granted) => {
      if (granted) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

export const request = (sites) => {
  return makeChromeCall(
      chrome.permissions.request.bind(chrome.permissions), sites);
};

export const check = (sites) => {
  return makeChromeCall(
      chrome.permissions.contains.bind(chrome.permissions), sites);
};

export const revoke = (sites) => {
  return makeChromeCall(
      chrome.permissions.remove.bind(chrome.permissions), sites);
};
