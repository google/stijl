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
import * as states from '../states';
import * as util from '../util';
import { BackendInterface } from './backendinterface';

export class GerritBackend extends BackendInterface {
  constructor(site) {
    super();
    this.site_ = site;
  }

  /**
   * Fetches changes from this backend.
   *
   * @public
   * @return {Promise<Change[]>} A list of changes.
   */
  fetch() {
    return this.ensureLogin_()
      .then((selfAddress) => this.doFetch_(selfAddress));
  }

  /**
   * Fetches changes from this backend.
   *
   * This function assumes the user is already logged in.
   *
   * @private
   * @return {Promise<Change[]>} A list of changes.
   */
  doFetch_(selfAddress) {
    const queries = [
      'is:open owner:' + selfAddress,
      'is:open reviewer:' + selfAddress + ' -owner:' + selfAddress,
      'is:merged owner:' + selfAddress + ' limit:20'
    ];
    let changesUrl =
        this.site_['url'] + '/changes/' +
        '?o=DETAILED_ACCOUNTS&o=REVIEWED&o=DETAILED_LABELS&o=SUBMITTABLE';
    queries.forEach((query) => {
      changesUrl += '&q=' + encodeURIComponent(query);
    });

    return fetch(changesUrl, {credentials: 'include'})
      .then((res) => res.text())
      .then((text) => {
        const data = JSON.parse(text.substring(text.indexOf('\n') + 1));
        return this.parseResponse_(data, selfAddress);
      });
  }

  /**
   * Log in to the code review site if we need.
   *
   * @private
   * @return Promise<string> Promise to return the mail address of the user.
   *   If login fails, the promise is rejected.
   */
  ensureLogin_() {
    return this.getSelfAddress_()
      .catch(() => this.attemptAutoLogin_())
      .catch(() => this.attemptManualLogin_());
  }

  /**
   * Returns the mail address of the user if they have already logged in.
   *
   * @private
   * @return Promise<string> Promise to return the mail address of the user.
   *   If the user is not logged in, the promise is rejected.
   */
  getSelfAddress_() {
    const accountsUrl = this.site_['url'] + '/accounts/self';
    return fetch(accountsUrl, {credentials: 'include'})
      .then((res) => res.text())
      .then((text) =>
        JSON.parse(text.substring(text.indexOf('\n') + 1)).email);
  }

  /**
   * Attempts login without user interaction.
   *
   * @private
   * @return Promise<string> Promise to return the mail address of the user.
   *   If login fails, the promise is rejected.
   */
  attemptAutoLogin_() {
    const loginUrl = this.site_['url'] + '/login/';
    // Set no-cors to follow redirects to other hosts (accounts.google.com).
    // Note that we can't read the response of this request and thus can't know
    // if it succeeded or not.
    return fetch(
      loginUrl, {mode: 'no-cors', credentials: 'include', redirect: 'follow'})
      .then(() => this.getSelfAddress_());
  }

  /**
   * Attempts login, showing tabs for manual interactions.
   *
   * @private
   * @return Promise<string> Promise to return the mail address of the user.
   *   If login fails, the promise is rejected.
   */
  attemptManualLogin_() {
    const loginUrl = this.site_['url'] + '/login/';
    return chromeAsync.tabs.create({url: loginUrl, active: true})
      .then((tab) => {
        const tabId = tab.id;
        const checkFinish = () => chromeAsync.tabs.get(tabId).then((tab) => {
          if (!tab) {
            throw new Error('Tab was closed');
          }

          const a = document.createElement('a');
          a.href = tab.url;
          if (!(a.pathname == '/' || a.pathname.indexOf('/dashboard/') == 0)) {
            // Not yet logged in. Wait 100ms and retry.
            return util.sleep(100).then(checkFinish);
          }

          console.log('Login success');
          chrome.tabs.remove(tabId);
          return this.getSelfAddress_();
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
        status = states.ChangeStatus.APPROVED;
      } else {
        const reviewersAll = entry['reviewers'] || {};
        const reviewers = reviewersAll['REVIEWER'] || [];
        const ownerId = entry['owner']['_account_id'];
        if (reviewers.findIndex(
          (user) => user['_account_id'] != ownerId) >= 0) {
          // Here non-owner user is listed.
          status = states.ChangeStatus.REVIEWING;
        } else {
          status = states.ChangeStatus.PENDING;
        }
      }
    } else if (entry['status'] == 'SUBMITTED' || entry['status'] == 'MERGED') {
      status = states.ChangeStatus.SUBMITTED;
    } else if (entry['status'] == 'ABANDONED') {
      status = states.ChangeStatus.ABANDONED;
    } else {
      status = states.ChangeStatus.UNKNOWN;
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
