// Copyright 2017 Google Inc.
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

import * as states from '../states';
import { BackendInterface } from './backendinterface';

const CHROMIUM_ENTRIES = [
  {
    owned: true,
    reviewing: false,
    subject: 'Clean up ARC file system unit tests.',
    url: 'chromium/1',
    status: states.ChangeStatus.PENDING,
    repository: 'chromium: chromium',
    ownerName: 'Shuhei Takahashi',
    updated: new Date().getTime() - 28 * 60 * 1000,
  },
  {
    owned: true,
    reviewing: false,
    subject: 'Defer ARC file system operations while ARC is booting.',
    url: 'chromium/2',
    status: states.ChangeStatus.APPROVED,
    repository: 'chromium: chromium',
    ownerName: 'Shuhei Takahashi',
    updated: new Date().getTime() - 25 * 60 * 60 * 1000,
  },
  {
    owned: true,
    reviewing: false,
    subject:
      'arc: Abort booting ARC if the device is critically low on disk space.',
    url: 'chromium/3',
    status: states.ChangeStatus.SUBMITTED,
    repository: 'chromium: chromium',
    ownerName: 'Shuhei Takahashi',
    updated: new Date().getTime() - 4 * 24 * 60 * 60 * 1000,
  },
  {
    owned: false,
    reviewing: true,
    subject: 'Move free disk space check to session_manager.',
    url: 'chromium/4',
    status: states.ChangeStatus.REVIEWING,
    repository: 'chromium: chromium',
    ownerName: 'Hidehiko Abe',
    updated: new Date().getTime() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    owned: false,
    reviewing: false,
    subject: 'ARC is not allowed for incognito profile.',
    url: 'chromium/5',
    status: states.ChangeStatus.APPROVED,
    repository: 'chromium: chromium',
    ownerName: 'Hidehiko Abe',
    updated: new Date().getTime() - 17 * 60 * 60 * 1000,
  },
];

const CHROMIUM_OS_ENTRIES = [
  {
    owned: true,
    reviewing: false,
    subject: 'target-chromium-os-sdk: Add relocation_packer from Android.',
    url: 'chromiumos/1',
    status: states.ChangeStatus.REVIEWING,
    repository: 'chromium-os: chromiumos-overlay',
    ownerName: 'Shuhei Takahashi',
    updated: new Date().getTime() - 21 * 60 * 60 * 1000,
  },
  {
    owned: true,
    reviewing: false,
    subject: 'login: Consistently mention "account ID".',
    url: 'chromiumos/2',
    status: states.ChangeStatus.REVIEWING,
    repository: 'chromium-os: platform2',
    ownerName: 'Shuhei Takahashi',
    updated: new Date().getTime() - 17 * 24 * 60 * 60 * 1000,
  },
  {
    owned: false,
    reviewing: true,
    subject: 'login: Add free-disk-size check on StartArcInstance().',
    url: 'chromiumos/3',
    status: states.ChangeStatus.APPROVED,
    repository: 'chromium-os: platform2',
    ownerName: 'Hidehiko Abe',
    updated: new Date().getTime() - 23 * 60 * 60 * 1000,
  },
];

export class DemoBackend extends BackendInterface {
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
    if (this.site_.label === 'chromium') {
      return Promise.resolve(CHROMIUM_ENTRIES);
    }
    if (this.site_.label === 'chromium-os') {
      return Promise.resolve(CHROMIUM_OS_ENTRIES);
    }
    return Promise.reject(new Error('Unknown label: ' + this.site_.label));
  }
}
