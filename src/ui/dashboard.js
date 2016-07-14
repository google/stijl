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

import * as backend_lib from '../backend';
import * as permissions from '../permissions';
import * as storage from '../storage';
import * as config from './config';
import * as misc from './misc';
import * as util from '../util';

export const update = () => {
  return storage.getConfiguredSites().then((sites) => {
    if (sites.length == 0) {
      config.show();
      return;
    }

    return permissions.check(sites).then(() => {
      const allChanges = [];

      $('#site_list').empty();
      const fetches = [];
      sites.forEach((site) => {
        const $label = $('<span>').attr('class', 'label label-warning')
            .append($('<a>').css('color', 'white').attr('href', site['url'])
            .attr('target', '_blank').text(site['label']));
        $('#site_list').append($label);

        const backend = backend_lib.create(site);
        if (!backend) {
          $label.attr('class', 'label label-danger');
          console.log('Unknown site type: ' + site['type']);
          return;
        }

        const fetch = backend.fetch().then((changes) => {
          console.log('Fetched from ' + site['label']);
          allChanges.push(...changes);
          updateChanges(allChanges);
          $label.attr('class', 'label label-success');
        }, (err) => {
          console.log('Failed to fetch from ' + site['label'] + ':');
          console.log(err);
          $label.attr('class', 'label label-danger');
        });
        fetches.push(fetch);
      });

      $('#loading').show();
      return $.when.apply($, fetches).always(() => {
        $('#loading').hide();
        console.log('All fetches finished');
      });
    }, () => {
      misc.showPermissionRequiredModal();
    });
  });
};

const insertChangesPerSection = (changes, $section) => {
  let $before = $section;
  changes.forEach((change) => {
    const $tr = $('<tr>').attr('class', 'change').append(
        $('<td>').append(
            $('<a>').attr('href', change['url']).text(change['subject'])
                .attr('target', '_blank').attr('title', change['subject'])),
        $('<td>').append(
            $('<div>').addClass('status-marker status-marker-' + change['status']),
            $('<span>').text(change['status'])),
        $('<td>').append(
            $('<span>').text(change['ownerName']).attr('title', change['ownerName'])),
        $('<td>').append(
            $('<span>').text(change['repository']).attr('title', change['repository'])),
        $('<td>').text(util.formatPrettyTime(change['updated'])));
    $before.after($tr);
    $before = $tr;
  });
};

const updateChanges = (allChanges) => {
  const changesByCategory = {
    outgoing: [],
    incoming: [],
    pending: [],
    submitted: [],
    cced: []
  };

  allChanges.forEach((change) => {
    let category;
    if (change['owned']) {
      if (change['status'] == 'Pending') {
        category = 'pending';
      } else if (change['status'] == 'Reviewing' ||
          change['status'] == 'Approved') {
        category = 'outgoing';
      } else if (change['status'] == 'Submitted') {
        const deltaInMillis = Date.now() - new Date(change['updated']);
        if (deltaInMillis < 7 * 24 * 60 * 60 * 1000) {
          category = 'submitted';
        }
      }
    } else if (change['reviewing']) {
      category = 'incoming';
    } else {
      category = 'cced';
    }
    if (category) {
      changesByCategory[category].push(change);
    }
  });

  Object.keys(changesByCategory).forEach((key) => {
    changesByCategory[key].sort((a, b) => {
      if (a['updated'] < b['updated']) {
        return 1;
      }
      if (a['updated'] > b['updated']) {
        return -1;
      }
      return 0;
    });
  });

  $('.change').remove();
  insertChangesPerSection(changesByCategory['outgoing'], $('#changes_outgoing'));
  insertChangesPerSection(changesByCategory['incoming'], $('#changes_incoming'));
  insertChangesPerSection(changesByCategory['cced'], $('#changes_cced'));
  insertChangesPerSection(changesByCategory['pending'], $('#changes_pending'));
  insertChangesPerSection(changesByCategory['submitted'], $('#changes_submitted'));
};

export const installHandlers = () => {
  $('#config_button').click(() => config.show());
};
