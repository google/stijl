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

export class RietveldBackend {
  constructor(site) {
    this.site_ = site;
  }

  fetch() {
    return this.ensureLogin_().then(this.fetchAll_.bind(this));
  }

  fetchAll_(selfAddress) {
    const searchPromises = [
      this.doSearch_(
          'limit=1000&owner=' + selfAddress + '&closed=False',
          selfAddress),
      this.doSearch_(
          'limit=1000&reviewer=' + selfAddress + '&closed=False',
          selfAddress),
      this.doSearch_(
          'limit=1000&cc=' + selfAddress + '&closed=False',
          selfAddress),
      this.doSearch_(
          'limit=1000&owner=' + selfAddress + '&closed=True',
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
          // For open review, we need detailed messages to decide approval state.
          const refetchPromise =
                entry['closed'] && entry['reviewers'].length > 0 ?
                Promise.resolve(entry) : this.doFetchOne_(entry['issue']);
          const promise = refetchPromise.then((entry) => {
            return this.parseEntry_(entry, selfAddress);
          });
          promises.push(promise);
        });
        return Promise.all(promises).then((changes) => changes);
      });
  }

  doFetchOne_(issue) {
    const url = this.site_['url'] + '/api/' + issue + '?messages=True';
    return fetch(url, {credentials: 'include'}).then((res) => res.json());
  };

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
    const change = {
      owned: entry['owner_email'] == selfAddress,
      reviewing: entry['reviewers'].indexOf(selfAddress) >= 0,
      subject: entry['subject'],
      url: this.site_['url'] + '/' + entry['issue'] + '/',
      status: status,
      repository: this.site_['label'] + ': ' + entry['project'],
      ownerName: entry['owner'],
      updated: new Date(entry['modified'] + ' UTC').getTime()
    };
    return change;
  }

  ensureLogin_() {
    return this.getSelfAddress_().then((selfAddress) => {
      return selfAddress;
    }, (err) => {
      return this.login_().then(this.getSelfAddress_.bind(this));
    });
  }

  getSelfAddress_() {
    return fetch(this.site_['url'], {credentials: 'include'})
      .then((res) => res.text()).then((text) => {
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
        const loginUrl = $doc.find('a:contains("Sign in")').first().attr('href');
        return new Promise((resolve, reject) => {
          chrome.tabs.create({url: loginUrl, active: true}, (tab) => {
            const tabId = tab.id;
            const checkFinish = () => {
              chrome.tabs.get(tabId, (tab) => {
                if (!tab) {
                  reject(new Error('Tab was closed'));
                } else {
                  const a = document.createElement('a');
                  a.href = tab.url;
                  if (a.pathname == '/') {
                    console.log('Login success');
                    chrome.tabs.remove(tabId);
                    resolve();
                  } else {
                    setTimeout(checkFinish, 100);
                  }
                }
              });
            };
            checkFinish();
          });
        });
      });
  }
}
