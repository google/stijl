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
 * Enum of the site type.
 * @enum {string}
 */
export const SiteType = {
  DEMO: 'demo',
  GERRIT: 'gerrit',
};

/**
 * Current modal dialog content type.
 * @enum {string}
 */
export const Modal = {
  PERMISSION: 'permission',
  CONFIG: 'config',
};

/**
 * Enum of changing status.
 * @enum {string}
 */
export const ChangeStatus = {
  /** The change status is not the one of following known status. */
  UNKNOWN: 'Unknown',
  /** The change is abandoned. */
  ABANDONED: 'Abandoned',
  /** The change is uploaded, but not yet under review. */
  PENDING: 'Pending',
  /** The change is under review. */
  REVIEWING: 'Reviewing',
  /** The change is approved to be submitted. */
  APPROVED: 'Approved',
  /** The change is submitted to the repository. */
  SUBMITTED: 'Submitted',
};

/** This represents the state model schama by example. */
// eslint-disable-next-line no-unused-vars
const EXAMPLE_STATE = {
  /** @type {Config} */
  config: {
    sites: [
      /** @type {Site} */
      {
        /** @type {string} */
        label: 'Label of the code review site',
        /** @type {string} */
        url: 'URL of the code review site top page',
        /** @type {SiteType} */
        type: 'Site type'
      }
    ],
  },

  /** @type {Modal} */
  modal: 'Current modal dialog type.',

  activeSites: [
    /** @type {ActiveSite} */
    {
      // This mixin of Site and the following fields.

      /** @type {boolean} */
      loading: 'Whether if it is loading from the site',
      /** @type {boolean} */
      success: 'Whether if loading is succeeded'
    }
  ],

  /** @type {Object<string, Charnge[]>} */
  activeChangesBySite: {
    /** siteLabel must be a string label indicating one of the sites. */
    siteLabel: [
      /** @type {Change} */
      {
        /** @type {boolean} */
        owned: 'Whether the change is owned by the user',
        /** @type {boolean} */
        reviewing: 'Whether if the user is in the reviewer list',
        /** @type {string} */
        subject: 'Subject of the code review',
        /** @type {string} */
        url: 'URL of the code review entry',
        /** @type {ChangeStatus} */
        status: 'Current status of the change. See ChangeStatus for details.',
        /** @type {string} */
        repository: 'Description of the repository',
        /** @type {string} */
        ownerName: 'Name of the change owner',
        /** @type {number} */
        updated: 'Last update time in milliseconds from UNIX epoch',
      }
    ]
  }
};
