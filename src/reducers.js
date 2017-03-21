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
import * as states from './states';

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
  switch (action.type) {
    case actions.SHOW_PERMISSION_MODAL:
      return states.Modal.PERMISSION;
    case actions.SHOW_CONFIG_MODAL:
      return states.Modal.CONFIG;
    case actions.CLOSE_MODAL:
      return null;
    default:
      return state;
  }
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
