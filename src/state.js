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
  GERRIT: 'gerrit',
  RIETVELD: 'rietveld',
};

/**
 * One code review site.
 * @typedef {Object} Site
 * @property {string} label - Label of the code review site.
 * @property {string} url - URL of the code review site top page.
 * @property {SiteType} type - Site type, e.g. gerrit.
 */

/**
 * One active code review site.
 * @typedef {Object} ActiveSite
 * @mixes Site
 * @property {boolean} loading - Whether the loading from the site is running.
 * @property {boolean} success - Whether the loading is successfully done.
 */

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

/**
 * One change information.
 * @typdef {Object} Change
 * @property {boolean} owned - Whether the change is written by the user.
 * @property {boolean} reviewing - Whether if the user is in the reviewer list.
 * @property {string} subject - Subject of the code review.
 * @property {string} url - URL of the code review entry.
 * @property {ChangeStatus} status - Current status of the change.
 * @property {string} repository - Description of the repository.
 * @property {string} ownerName - Name of the change owner.
 * @property {number} updated - Last update time in milliseconds from Unix
 *     epoch.
 */

/**
 * User settings.
 * @typedef {Object} Config
 * @property {Site[]} sites - Added sites.
 */

/**
 * Whole state used by Redux.
 * @typedef {Object} State
 * @property {Config} config - User configuration.
 * @property {Modal} modal - Current modal state.
 * @property {ActiveSite[]} activeSites - Current active site list.
 * @property {Object.<string, Change[]>} activeChangesBySite - Map from site
 *     label to its changes.
 */
