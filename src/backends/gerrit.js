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

import chromeAsync from '../chromeasync'
import * as util from '../util'

export class GerritBackend {
  constructor(site) {
    this.site_ = site;
  }

  fetch() {
    return this.ensureLogin_()
      .then((selfAddress) => this.fetchAll_(selfAddress));
  }

  fetchAll_(selfAddress) {
    const queries = [
      'is:open owner:' + selfAddress,
      'is:open reviewer:' + selfAddress + ' -owner:' + selfAddress,
      'is:merged owner:' + selfAddress + ' limit:20'
    ];
    let changesUrl =
        this.site_['url'] +
        '/changes/?o=DETAILED_ACCOUNTS&o=REVIEWED&o=DETAILED_LABELS';
    queries.forEach((query, i) => {
      changesUrl += '&q=' + encodeURIComponent(query);
    });

    return fetch(changesUrl, {credentials: 'include'})
      .then((res) => res.text())
      .then((text) => {
        const data = JSON.parse(text.substring(text.indexOf('\n') + 1))
        return this.parseResponse_(data, selfAddress);
      });
  }

  ensureLogin_() {
    return this.getSelfAddress_().catch((err) =>
	this.login_().then(() => this.getSelfAddress_()));
  }

  getSelfAddress_() {
    const accountsUrl = this.site_['url'] + '/accounts/self';
    return fetch(accountsUrl, {credentials: 'include'})
      .then((res) => res.text())
      .then((text) =>
        JSON.parse(text.substring(text.indexOf('\n') + 1)).email);
  }

  login_() {
    const loginUrl = this.site_['url'] + '/login/';
    return chromeAsync.tabs.create({url: loginUrl, active: true})
      .then((tab) => {
        const tabId = tab.id;
        const checkFinish = () => chromeAsync.tabs.get(tabId).then((tab) => {
          if (!tab) {
            return Promise.reject(new Error('Tab was closed'));
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

  parseResponse_(data, selfAddress) {
    const changes = [];
    data.forEach((entries) => {
      entries.forEach((entry) => {
        changes.push(this.parseEntry_(entry, selfAddress));
      });
    });
    return changes;
  }

  parseEntry_(entry, selfAddress) {
    let status;
    if (entry['status'] == 'NEW' || entry['status'] == 'DRAFT') {
      if (entry['submittable']) {
        status = 'Approved';
      } else {
        const reviewers = entry['labels']['Code-Review']['all'] || [];
        const ownerId = entry['owner']['_account_id'];
        if (reviewers.find((user) => user['_account_id'] != ownerId) >= 0) {
          // Here non-owner user is listed.
          status = 'Reviewing';
        } else {
          status = 'Pending';
        }
      }
    } else if (entry['status'] == 'SUBMITTED' || entry['status'] == 'MERGED') {
      status = 'Submitted';
    } else if (entry['status'] == 'ABANDONED') {
      status = 'Abandoned';
    } else {
      status = 'Unknown';
    }
    return {
      owned: entry['owner']['email'] == selfAddress,
      reviewing: true,  // Gerrit does not support CC.
      subject: entry['subject'],
      url: this.site_['url'] + '/#/c/' + entry['_number'],
      status: status,
      repository: this.site_['label'] + ': ' + entry['project'] + ' (' +
          entry['branch'] + ')',
      ownerName: entry['owner']['name'],
      updated: new Date(entry['updated'] + ' UTC').getTime()
    };
  }
}
