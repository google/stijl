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

import * as permissions from '../permissions';
import * as storage from '../storage';
import * as dashboard from './dashboard';

const handlePermissionContinueButton = () => {
  storage.getConfiguredSites().then((sites) => {
    return permissions.request(sites);
  }).then(() => {
    $('#permission_modal').modal('hide');
    dashboard.update();
  });
};

export const showPermissionRequiredModal = () => {
  $('#permission_modal').modal('show');
};

export const installHandlers = () => {
  $('#permission_modal_continue').click(handlePermissionContinueButton);
};
