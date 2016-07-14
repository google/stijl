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

const addConfigSiteLine = (site) => {
  const $modal = $('#config_modal');
  const $form = $modal.find('.modal-body form').first();

  let $line;
  if (Object.keys(site).length > 0) {
    $form.find('.config-modal-site-line').each((_, obj) => {
      const $l = $(obj);
      if (!$l.find('input[name=label]').val() &&
          !$l.find('input[name=url]').val()) {
        $line = $l;
        return true;
      }
    });
  }
  if (!$line) {
    const $template = $modal.find('#config_modal_site_line_template');
    $line = $template.clone().removeAttr('id');
    $form.append($line);
  }
  $line.find('input[name=label]').val(site['label']);
  $line.find('input[name=url]').val(site['url']);
  $line.find('select[name=type]').val(site['type'] || 'gerrit');
  $line.find('.close').click((e) => handleConfigRemoveSiteButton(e.target));
  renumberConfigSiteLines();
};

const clearConfigSiteLines = () => {
  const $modal = $('#config_modal');
  const $form = $modal.find('.modal-body form').first();
  $form.find('.config-modal-site-line').remove();
};

const renumberConfigSiteLines = () => {
  const $modal = $('#config_modal');
  const $form = $modal.find('.modal-body form').first();
  $form.find('.config-modal-site-line').each((i, obj) => {
    const $line = $(obj);
    $line.find('.form-index').text((i + 1) + '.');
  });
};

const handleConfigAddSiteButton = () => {
  addConfigSiteLine({});
};

const handleConfigRemoveSiteButton = (target) => {
  const $line = $(target).closest('.config-modal-site-line');
  $line.remove();
  renumberConfigSiteLines();
};

const handleConfigSaveButton = () => {
  const sites = [];
  const $modal = $('#config_modal');
  const $form = $modal.find('.modal-body form').first();
  $form.find('.config-modal-site-line').each((_, obj) => {
    const $line = $(obj);
    const label = $line.find('input[name=label]').val();
    const url = $line.find('input[name=url]').val();
    const type = $line.find('select[name=type]').val();
    if (!label || !url || !type) {
      return;
    }
    const site = {label: label, url: url, type: type};
    sites.push(site);
  });
  permissions.request(sites).then(() => {
    chrome.storage.sync.set({sites: sites}, () => {
      $modal.modal('hide');
      dashboard.update();
    });
  });
};

const handleConfigPresetButton = (target) => {
  const $button = $(target);
  const site = {
    label: $button.attr('data-label'),
    url: $button.attr('data-url'),
    type: $button.attr('data-type')
  };
  let exist = false;
  const $modal = $('#config_modal');
  const $form = $modal.find('.modal-body form').first();
  $form.find('.config-modal-site-line').each((_, obj) => {
    const $line = $(obj);
    if ($line.find('input[name=url]').val() == site['url']) {
      exist = true;
      return true;
    }
  });
  if (!exist) {
    addConfigSiteLine(site);
  }
};

export const show = () => {
  storage.getConfiguredSites().then((sites) => {
    clearConfigSiteLines();
    sites.forEach(addConfigSiteLine);
    if (sites.length == 0) {
      addConfigSiteLine({});
    }
    $('#config_modal').modal('show');
  });
};

export const installHandlers = () => {
  $('#config_modal_add_site').click(handleConfigAddSiteButton);
  $('#config_modal_save').click(handleConfigSaveButton);
  $('.preset-button').click((e) => handleConfigPresetButton(e.target));
};
