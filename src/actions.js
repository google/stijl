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

import * as backends from './backends';
import * as permissions from './permissions';

export const UPDATE_CONFIG = 'UPDATE_CONFIG';
export const UPDATE_SITES = 'UPDATE_SITES';
export const SHOW_PERMISSION_MODAL = 'SHOW_PERMISSION_MODAL';
export const SHOW_CONFIG_MODAL = 'SHOW_CONFIG_MODAL';
export const CLOSE_MODAL = 'CLOSE_MODAL';
export const START_REFRESH_ALL = 'START_REFRESH_ALL';
export const UPDATE_CHANGES_BY_SITE = 'UPDATE_CHANGES_BY_SITE';
export const FINISH_REFRESH_SITE = 'FINISH_REFRESH_SITE';

export const updateConfig = (config) => {
  return {
    type: UPDATE_CONFIG,
    config,
  };
};

export const updateSites = (sites) => {
  return {
    type: UPDATE_SITES,
    sites,
  };
};

export const showPermissionModal = () => {
  return {
    type: SHOW_PERMISSION_MODAL,
  };
};

export const showConfigModal = () => {
  return {
    type: SHOW_CONFIG_MODAL,
  };
};

export const closeModal = () => {
  return {
    type: CLOSE_MODAL,
  };
};

const startRefreshAll = () => {
  return (dispatch, getState) => {
    const sites = getState().config.sites;
    dispatch({
      type: START_REFRESH_ALL,
      sites,
    });
  };
};

const updateChangesBySite = (label, changes) => {
  return {
    type: UPDATE_CHANGES_BY_SITE,
    label,
    changes,
  };
};

const finishRefreshSite = (label, success) => {
  return {
    type: FINISH_REFRESH_SITE,
    label,
    success,
  };
};

export const refreshAll = () => {
  return async (dispatch, getState) => {
    dispatch(startRefreshAll());

    const { activeSites } = getState();

    try {
      await permissions.check(activeSites);
    } catch (err) {
      dispatch(showPermissionModal());
      return;
    }

    for (const site of Object.values(activeSites)) {
      const backend = backends.create(site);
      try {
        const changes = await backend.fetch();
        dispatch(updateChangesBySite(site.label, changes));
        dispatch(finishRefreshSite(site.label, true));
      } catch (err) {
        dispatch(finishRefreshSite(site.label, false));
        console.error(err);
      }
    }
  };
};
