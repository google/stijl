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

import * as Redux from 'redux';
import partialUpdate from 'react-addons-update';

import * as actions from './actions';

const EXAMPLE_STATE = {
  config: {
    sites: [
      {
        label: "Label of the code review site",
        url: "URL of the code review site top page",
        type: "gerrit/rietveld",
      },
      // ....
    ],
  },
  modal: "permission/config/null",
  activeSites: [
    {
      label: "Label of the code review site",
      url: "URL of the code review site top page",
      type: "gerrit/rietveld",
      loading: "true if loading from the site",
      success: "true if loading suceeded",
    },
    // ...
  ],
  activeChangesBySite: {
    siteLabel: {
      owned: "true if the change is owned by the user",
      reviewing: "true if the user is in the reviewer list",
      subject: "Subject of the code review",
      url: "URL of the code review entry",
      status: "Pending/Reviewing/Approved/Submitted",
      repository: "Description of the repository",
      ownerName: "Name of the change owner",
      updated: "milliseconds from UNIX epoch",
    },
    // ...
  },
};

const config = (state = {sites: []}, action) => {
  if (action.type == actions.UPDATE_CONFIG) {
    const update = {};
    Object.keys(action.config).forEach((key) => {
      const value = action.config[key];
      update[key] = {$set: value};
    });
    return partialUpdate(state, update);
  } else if (action.type == actions.UPDATE_SITES) {
    return partialUpdate(state, {
      sites: {$set: action.sites},
    });
  }
  return state;
};

const modal = (state = null, action) => {
  if (action.type == actions.SHOW_PERMISSION_MODAL) {
    return 'permission';
  } if (action.type == actions.SHOW_CONFIG_MODAL) {
    return 'config';
  } if (action.type == actions.CLOSE_MODAL) {
    return null;
  }
  return state;
};

const activeSites = (state = [], action) => {
  if (action.type == actions.START_REFRESH_ALL) {
    const { sites } = action;
    return sites.map((site) => {
      return Object.assign({}, site, { loading: true, success: false });
    });
  } else if (action.type == actions.FINISH_REFRESH_SITE) {
    let index = -1;
    state.forEach((site, i) => {
      if (site.label === action.label) {
        index = i;
      }
    });
    if (index < 0) {
      console.error(`Unknown label: ${action.label}`);
      return state;
    }
    return partialUpdate(state, {
      [index]: {
        loading: { $set: false },
        success: { $set: action.success },
      },
    });
  }
  return state;
};

const activeChangesBySite = (state = {}, action) => {
  if (action.type == actions.START_REFRESH_ALL) {
    return {};
  } else if (action.type == actions.UPDATE_CHANGES_BY_SITE) {
    return partialUpdate(state, { [action.label]: { $set: action.changes } });
  }
  return state;
};

export const rootReducer = Redux.combineReducers({
  config,
  modal,
  activeSites,
  activeChangesBySite,
});
