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

import chromeAsync from '../chromeasync';
import * as util from '../util';

/**
 * The number of entries to be fetched.
 * According to the API spec, this can be [0-1000], but practically, when
 * setting this to 1000, the server returns 500 error.
 */
const entryLimit = 300;

export class RietveldBackend {
  constructor(site) {
    this.site_ = site;
  }

  fetch() {
    return this.ensureLogin_()
      .then((selfAddress) => this.fetchAll_(selfAddress));
  }

  fetchAll_(selfAddress) {
    const searchPromises = [
      this.doSearch_(
          'limit=' + entryLimit + '&owner=' + selfAddress + '&closed=False',
          selfAddress),
      this.doSearch_(
          'limit=' + entryLimit + '&reviewer=' + selfAddress + '&closed=False',
          selfAddress),
      this.doSearch_(
          'limit=' + entryLimit + '&cc=' + selfAddress + '&closed=False',
          selfAddress),
      this.doSearch_(
          'limit=' + entryLimit + '&owner=' + selfAddress + '&closed=True',
          selfAddress)
    ];
    return Promise.all(searchPromises).then((changesFromSearches) => {
      // Dedup changes in case searches returned overlapping results.
      const allChanges = [];
      const knownUrls = {};
      changesFromSearches.forEach((changes) => {
        changes.forEach((change) => {
          const url = change['url'];
          if (!knownUrls[url]) {
            knownUrls[url] = true;
            allChanges.push(change);
          }
        });
      });
      return allChanges;
    });
  }

  doSearch_(param, selfAddress) {
    const url = this.site_['url'] + '/search?format=json&' + param;
    return fetch(url, {credentials: 'include'})
      .then((res) => res.json()).then((data) => {
        const promises = [];
        data['results'].forEach((entry) => {
          // For open review, we need detailed messages to decide approval
          // state.
          const refetchPromise =
              entry['closed'] && entry['reviewers'].length > 0 ?
              Promise.resolve(entry) : this.doFetchOne_(entry['issue']);
          const promise = refetchPromise.then((entry) => {
            return this.parseEntry_(entry, selfAddress);
          });
          promises.push(promise);
        });
        return Promise.all(promises);
      });
  }

  doFetchOne_(issue) {
    const url = this.site_['url'] + '/api/' + issue + '?messages=True';
    return fetch(url, {credentials: 'include'}).then((res) => res.json());
  }

  parseEntry_(entry, selfAddress) {
    let status;
    if (entry['closed']) {
      // This might be true only on codereview.chromium.org...
      if (entry['description'].indexOf('\nCommitted: ') > 0) {
        status = 'Submitted';
      } else {
        status = 'Abandoned';
      }
    } else {
      if (entry['reviewers'].length > 0) {
        // TODO: Improve approval check.
        const messages = entry['messages'] || [];
        const approvals = {};
        messages.forEach((message) => {
          if (message['disapproval']) {
            approvals[message['sender']] = false;
          } else if (message['approval']) {
            approvals[message['sender']] = true;
          }
        });
        let approved = false;
        Object.keys(approvals).forEach((sender) => {
          if (approvals[sender]) {
            approved = true;
          }
        });
        if (approved) {
          status = 'Approved';
        } else {
          status = 'Reviewing';
        }
      } else {
        status = 'Pending';
      }
    }
    return {
      owned: entry['owner_email'] == selfAddress,
      reviewing: entry['reviewers'].indexOf(selfAddress) >= 0,
      subject: entry['subject'],
      url: this.site_['url'] + '/' + entry['issue'] + '/',
      status: status,
      repository: this.site_['label'] + ': ' + entry['project'],
      ownerName: entry['owner'],
      updated: new Date(entry['modified'] + ' UTC').getTime()
    };
  }

  ensureLogin_() {
    return this.getSelfAddress_().catch((err) =>
        this.login_().then(() => this.getSelfAddress_()));
  }

  getSelfAddress_() {
    return fetch(this.site_['url'], {credentials: 'include'})
      .then((res) => res.text())
      .then((text) => {
        const $doc = $(new DOMParser().parseFromString(text, 'text/html'));
        const selfAddress =
            $doc.find('body > div[align=right] > b').text().split(' ')[0];
        if (!selfAddress) {
          throw new Error('Not logged in');
        }
        return selfAddress;
      });
  }

  login_() {
    return fetch(this.site_['url'], {credentials: 'include'})
      .then((res) => res.text()).then((text) => {
        const $doc = $(new DOMParser().parseFromString(text, 'text/html'));
        const loginUrl =
            $doc.find('a:contains("Sign in")').first().attr('href');
        return chromeAsync.tabs.create({url: loginUrl, active: true});
      }).then((tab) => {
        const tabId = tab.id;
        const checkFinish = () => chromeAsync.tabs.get(tabId).then((tab) => {
          if (!tab) {
            throw new Error('Tab was closed');
          }

          const a = document.createElement('a');
          a.href = tab.url;
          if (a.pathname != '/') {
            // Not yet logged in. Wait 100ms and retry.
            return util.sleep(100).then(checkFinish);
          }

          console.log('Login success');
          chrome.tabs.remove(tabId);
        });
        return checkFinish();
      });
  }
}
