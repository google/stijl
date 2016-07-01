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

var stijl = window.stijl || {};


////////////////////////////////////////////////////////////////////////////////
// stijl.util

stijl.util = stijl.util || {};

stijl.util.MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

stijl.util.fillZeros = function(number, digits) {
  var s = Array(digits).join('0') + number;
  return s.slice(s.length - digits);
};

stijl.util.formatPrettyTime = function(timestamp) {
  var date = new Date(timestamp);
  var deltaInMillis = Date.now() - timestamp;
  if (deltaInMillis < 0) {
    return 'future';
  } else if (deltaInMillis < 20 * 60 * 60 * 1000) {
    return '' + date.getHours() + ':' +
        stijl.util.fillZeros(date.getMinutes(), 2);
  } else if (deltaInMillis < 340 * 24 * 60 * 60 * 1000) {
    return '' + stijl.util.MONTHS[date.getMonth()] + ' ' + date.getDate();
  }
  return '' + stijl.util.MONTHS[date.getMonth()] + ' ' + date.getDate() +
      ' ' + date.getFullYear();
};


////////////////////////////////////////////////////////////////////////////////
// stijl.storage

stijl.storage = stijl.storage || {};

stijl.storage.getConfiguredSites = function() {
  var result = $.Deferred();
  chrome.storage.sync.get(null, function(items) {
    var sites = items['sites'] || [];
    result.resolve(sites);
  });
  return result.promise();
};


////////////////////////////////////////////////////////////////////////////////
// stijl.permissions

stijl.permissions = stijl.permissions || {};

stijl.permissions.makeChromeCall_ = function(method, sites) {
  var result = $.Deferred();
  var origins = sites.map(function(site) {
    var a = document.createElement('a');
    a.href = site['url'];
    return a.origin + '/';
  });
  method({origins: origins}, function(granted) {
    if (granted) {
      result.resolve();
    } else {
      result.reject();
    }
  });
  return result.promise();
};

stijl.permissions.request = function(sites) {
  return stijl.permissions.makeChromeCall_(
      chrome.permissions.request.bind(chrome.permissions), sites);
};

stijl.permissions.check = function(sites) {
  return stijl.permissions.makeChromeCall_(
      chrome.permissions.contains.bind(chrome.permissions), sites);
};

stijl.permissions.revoke = function(sites) {
  return stijl.permissions.makeChromeCall_(
      chrome.permissions.remove.bind(chrome.permissions), sites);
};


////////////////////////////////////////////////////////////////////////////////
// stijl.backends

stijl.backends = stijl.backends || {};

stijl.backends.create = function(site) {
  if (site['type'] == 'gerrit') {
    return new stijl.backends.GerritBackend(site);
  } else if (site['type'] == 'rietveld') {
    return new stijl.backends.RietveldBackend(site);
  }
  return null;
};

stijl.backends.GerritBackend = function(site) {
  this.site_ = site;
};

stijl.backends.GerritBackend.prototype.fetch = function() {
  return this.ensureLogin_().then(this.fetchAll_.bind(this));
};

stijl.backends.GerritBackend.prototype.fetchAll_ = function(selfAddress) {
  var queries = [
    'is:open owner:' + selfAddress,
    'is:open reviewer:' + selfAddress + ' -owner:' + selfAddress,
    'is:merged owner:' + selfAddress + ' limit:20'
  ];
  var changesUrl =
      this.site_['url'] +
      '/changes/?o=DETAILED_ACCOUNTS&o=REVIEWED&o=DETAILED_LABELS';
  queries.forEach(function(query, i) {
    changesUrl += '&q=' + encodeURIComponent(query);
  });
  // Avoid auth dialog on 401.
  changesUrl = changesUrl.replace('://', '://a:b@');

  return $.ajax({
    url: changesUrl,
    dataType: 'text'
  }).then(function(text) {
    var data;
    try {
      data = JSON.parse(text.substring(text.indexOf('\n') + 1));
    } catch(exc) {
      // When login cookie is expired, the server returns 200 with login form.
      // Pretend 401 to proceed to login.
      var err = {status: 401, exc: exc};
      return $.Deferred().reject(err);
    }
    return this.parseResponse_(data, selfAddress);
  }.bind(this));
};

stijl.backends.GerritBackend.prototype.ensureLogin_ = function() {
  return this.getSelfAddress_().then(function(selfAddress) {
    return selfAddress;
  }.bind(this), function(err) {
    return this.login_().then(this.getSelfAddress_.bind(this));
  }.bind(this));
};

stijl.backends.GerritBackend.prototype.getSelfAddress_ = function() {
  var accountsUrl = this.site_['url'] + '/accounts/self';
  // Avoid auth dialog on 401.
  accountsUrl = accountsUrl.replace('://', '://a:b@');

  return $.ajax({
    url: accountsUrl,
    dataType: 'text'
  }).then(function(text) {
    var data;
    try {
      data = JSON.parse(text.substring(text.indexOf('\n') + 1));
    } catch (exc) {
      // When login cookie is expired, the server returns 200 with login form.
      // Pretend 401 to proceed to login.
      var err = {status: 401, exc: exc};
      return $.Deferred().reject(err);
    }
    return data['email'];
  });
};

stijl.backends.GerritBackend.prototype.login_ = function() {
  var result = $.Deferred();
  var loginUrl = this.site_['url'] + '/login/';
  chrome.tabs.create({url: loginUrl, active: true}, function(tab) {
    var tabId = tab.id;
    var checkFinish = function() {
      chrome.tabs.get(tabId, function(tab) {
        if (!tab) {
          result.reject('Tab was closed');
        } else {
          var a = document.createElement('a');
          a.href = tab.url;
          if (a.pathname == '/') {
            console.log('Login success');
            chrome.tabs.remove(tabId);
            result.resolve();
          } else {
            setTimeout(checkFinish, 100);
          }
        }
      });
    };
    checkFinish();
  });
  return result.promise();
};

stijl.backends.GerritBackend.prototype.parseResponse_ = function(data, selfAddress) {
  var changes = [];
  data.forEach(function(entries) {
    entries.forEach(function(entry) {
      changes.push(this.parseEntry_(entry, selfAddress));
    }.bind(this));
  }.bind(this));
  return changes;
};

stijl.backends.GerritBackend.prototype.parseEntry_ = function(entry, selfAddress) {
  var status;
  if (entry['status'] == 'NEW' || entry['status'] == 'DRAFT') {
    if (entry['submittable']) {
      status = 'Approved';
    } else {
      var reviewing = false;
      var reviewers = entry['labels']['Code-Review']['all'] || [];
      reviewers.forEach(function(user) {
        if (user['_account_id'] != entry['owner']['_account_id']) {
          reviewing = true;
        }
      });
      if (reviewing) {
        status = 'Reviewing';
      } else {
        status = 'Pending';
      }
    }
  } else if (entry['status'] == 'SUBMITTED' || entry['status'] == 'MERGED') {
    status = 'Submitted';
  } else if (entry['status'] == 'ABANDONED') {
    status = 'Abandoned';
  } else {
    status = 'Unknown';
  }
  var change = {
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
  return change;
};

stijl.backends.RietveldBackend = function(site) {
  this.site_ = site;
};

stijl.backends.RietveldBackend.prototype.fetch = function() {
  return this.ensureLogin_().then(this.fetchAll_.bind(this));
};

stijl.backends.RietveldBackend.prototype.fetchAll_ = function(selfAddress) {
  var searches = [
      this.doSearch_(
          'limit=1000&owner=' + selfAddress + '&closed=False',
          selfAddress),
      this.doSearch_(
          'limit=1000&reviewer=' + selfAddress + '&closed=False',
          selfAddress),
      this.doSearch_(
          'limit=1000&cc=' + selfAddress + '&closed=False',
          selfAddress),
      this.doSearch_(
          'limit=1000&owner=' + selfAddress + '&closed=True',
          selfAddress)
  ];
  return $.when.apply($, searches).then(function() {
    // Dedup changes in case searches returned overlapping results.
    var allChanges = [];
    var knownUrls = {};
    Array.prototype.slice.call(arguments).forEach(function(changes) {
      changes.forEach(function(change) {
        var url = change['url'];
        if (!knownUrls[url]) {
          knownUrls[url] = true;
          allChanges.push(change);
        }
      });
    });
    return allChanges;
  });
};

stijl.backends.RietveldBackend.prototype.doSearch_ = function(param, selfAddress) {
  var url = this.site_['url'] + '/search?format=json&' + param;
  return $.ajax({url: url, dataType: 'json'}).then(function(response) {
    var promises = [];
    response['results'].forEach(function(entry) {
      // For open review, we need detailed messages to decide approval state.
      var refetchPromise =
          entry['closed'] && entry['reviewers'].length > 0 ?
          $.when(entry) : this.doFetchOne_(entry['issue']);
      var promise = refetchPromise.then(function(entry) {
        return this.parseEntry_(entry, selfAddress);
      }.bind(this));
      promises.push(promise);
    }.bind(this));
    return $.when.apply($, promises).then(function() {
      return Array.prototype.slice.call(arguments);
    });
  }.bind(this));
};

stijl.backends.RietveldBackend.prototype.doFetchOne_ = function(issue) {
  var url = this.site_['url'] + '/api/' + issue + '?messages=True';
  return $.ajax({url: url, dataType: 'json'});
};

stijl.backends.RietveldBackend.prototype.parseEntry_ = function(entry, selfAddress) {
  var status;
  if (entry['closed']) {
    // This might be true only on codereview.chromium.org...
    if (entry['description'].indexOf('\nCommitted: ') > 0) {
      status = 'Submitted';
    } else {
      status = 'Abandoned';
    }
  } else {
    if (entry['reviewers'].length > 0) {
      // TODO: Improve approval check.
      var messages = entry['messages'] || [];
      var approvals = {};
      messages.forEach(function(message) {
        if (message['disapproval']) {
          approvals[message['sender']] = false;
        } else if (message['approval']) {
          approvals[message['sender']] = true;
        }
      });
      var approved = false;
      Object.keys(approvals).forEach(function(sender) {
        if (approvals[sender]) {
          approved = true;
        }
      });
      if (approved) {
        status = 'Approved';
      } else {
        status = 'Reviewing';
      }
    } else {
      status = 'Pending';
    }
  }
  var change = {
    owned: entry['owner_email'] == selfAddress,
    reviewing: entry['reviewers'].indexOf(selfAddress) >= 0,
    subject: entry['subject'],
    url: this.site_['url'] + '/' + entry['issue'] + '/',
    status: status,
    repository: this.site_['label'] + ': ' + entry['project'],
    ownerName: entry['owner'],
    updated: new Date(entry['modified'] + ' UTC').getTime()
  };
  return change;
};

stijl.backends.RietveldBackend.prototype.ensureLogin_ = function() {
  return this.getSelfAddress_().then(function(selfAddress) {
    return selfAddress;
  }.bind(this), function(err) {
    return this.login_().then(this.getSelfAddress_.bind(this));
  }.bind(this));
};

stijl.backends.RietveldBackend.prototype.getSelfAddress_ = function() {
  return $.ajax({
    url: this.site_['url'],
    dataType: 'text'
  }).then(function(text) {
    var $doc = $(new DOMParser().parseFromString(text, 'text/html'));
    var selfAddress =
        $doc.find('body > div[align=right] > b').text().split(' ')[0];
    if (!selfAddress) {
      return $.Deferred().reject();
    }
    return selfAddress;
  });
};

stijl.backends.RietveldBackend.prototype.login_ = function() {
  return $.ajax({
    url: this.site_['url'],
    dataType: 'text'
  }).then(function(text) {
    var $doc = $(new DOMParser().parseFromString(text, 'text/html'));
    var loginUrl = $doc.find('a:contains("Sign in")').first().attr('href');
    var result = $.Deferred();
    chrome.tabs.create({url: loginUrl, active: true}, function(tab) {
      var tabId = tab.id;
      var checkFinish = function() {
        chrome.tabs.get(tabId, function(tab) {
          if (!tab) {
            result.reject('Tab was closed');
          } else {
            var a = document.createElement('a');
            a.href = tab.url;
            if (a.pathname == '/') {
              console.log('Login success');
              chrome.tabs.remove(tabId);
              result.resolve();
            } else {
              setTimeout(checkFinish, 100);
            }
          }
        });
      };
      checkFinish();
    });
    return result.promise();
  });
};


////////////////////////////////////////////////////////////////////////////////
// stijl.ui

stijl.ui = stijl.ui || {};

stijl.ui.installHandlers = function() {
  stijl.ui.dashboard.installHandlers();
  stijl.ui.config.installHandlers();
  stijl.ui.misc.installHandlers();
};


////////////////////////////////////////////////////////////////////////////////
// stijl.ui.dashboard

stijl.ui.dashboard = stijl.ui.dashboard || {};

stijl.ui.dashboard.installHandlers = function() {
  $('#config_button').click(stijl.ui.dashboard.handleConfigButton_);
};

stijl.ui.dashboard.update = function() {
  return stijl.storage.getConfiguredSites().then(function(sites) {
    if (sites.length == 0) {
      stijl.ui.config.show();
      return;
    }

    return stijl.permissions.check(sites).then(function() {
      var allChanges = [];

      $('#site_list').empty();
      var fetches = [];
      sites.forEach(function(site) {
        var $label = $('<span>').attr('class', 'label label-warning')
            .append($('<a>').css('color', 'white').attr('href', site['url'])
            .attr('target', '_blank').text(site['label']));
        $('#site_list').append($label);

        var backend = stijl.backends.create(site);
        if (!backend) {
          $label.attr('class', 'label label-danger');
          console.log('Unknown site type: ' + site['type']);
          return;
        }

        var fetch = backend.fetch().then(function(changes) {
          console.log('Fetched from ' + site['label']);
          allChanges = allChanges.concat(changes);
          stijl.ui.dashboard.updateChanges_(allChanges);
          $label.attr('class', 'label label-success');
        }, function(err) {
          console.log('Failed to fetch from ' + site['label'] + ':');
          console.log(err);
          $label.attr('class', 'label label-danger');
        });
        fetches.push(fetch);
      });

      $('#loading').show();
      return $.when.apply($, fetches).always(function() {
        $('#loading').hide();
        console.log('All fetches finished');
      });
    }, function() {
      stijl.ui.misc.showPermissionRequiredModal();
    });
  });
};

stijl.ui.dashboard.handleConfigButton_ = function() {
  stijl.ui.config.show();
};

stijl.ui.dashboard.insertChangesPerSection_ = function(changes, $section) {
  var $before = $section;
  changes.forEach(function(change) {
    var $tr = $('<tr>').attr('class', 'change').append(
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
        $('<td>').text(stijl.util.formatPrettyTime(change['updated'])));
    $before.after($tr);
    $before = $tr;
  });
};

stijl.ui.dashboard.updateChanges_ = function(allChanges) {
  var changesByCategory = {
    outgoing: [],
    incoming: [],
    pending: [],
    submitted: [],
    cced: []
  };

  allChanges.forEach(function(change) {
    var category;
    if (change['owned']) {
      if (change['status'] == 'Pending') {
        category = 'pending';
      } else if (change['status'] == 'Reviewing' ||
          change['status'] == 'Approved') {
        category = 'outgoing';
      } else if (change['status'] == 'Submitted') {
        var deltaInMillis = Date.now() - new Date(change['updated']);
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

  Object.keys(changesByCategory).forEach(function(key) {
    changesByCategory[key].sort(function(a, b) {
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
  stijl.ui.dashboard.insertChangesPerSection_(changesByCategory['outgoing'], $('#changes_outgoing'));
  stijl.ui.dashboard.insertChangesPerSection_(changesByCategory['incoming'], $('#changes_incoming'));
  stijl.ui.dashboard.insertChangesPerSection_(changesByCategory['cced'], $('#changes_cced'));
  stijl.ui.dashboard.insertChangesPerSection_(changesByCategory['pending'], $('#changes_pending'));
  stijl.ui.dashboard.insertChangesPerSection_(changesByCategory['submitted'], $('#changes_submitted'));
};


////////////////////////////////////////////////////////////////////////////////
// stijl.ui.config

stijl.ui.config = stijl.ui.config || {};

stijl.ui.config.installHandlers = function() {
  $('#config_modal_add_site').click(stijl.ui.config.handleConfigAddSiteButton_);
  $('#config_modal_save').click(stijl.ui.config.handleConfigSaveButton_);
  $('.preset-button').click(stijl.ui.config.handleConfigPresetButton_);
};

stijl.ui.config.show = function() {
  stijl.storage.getConfiguredSites().then(function(sites) {
    stijl.ui.config.clearConfigSiteLines_();
    sites.forEach(stijl.ui.config.addConfigSiteLine_);
    if (sites.length == 0) {
      stijl.ui.config.addConfigSiteLine_({});
    }
    $('#config_modal').modal('show');
  });
};

stijl.ui.config.addConfigSiteLine_ = function(site) {
  var $modal = $('#config_modal');
  var $form = $modal.find('.modal-body form').first();

  var $line;
  if (Object.keys(site).length > 0) {
    $form.find('.config-modal-site-line').each(function() {
      var $l = $(this);
      if (!$l.find('input[name=label]').val() &&
          !$l.find('input[name=url]').val()) {
        $line = $l;
        return true;
      }
    });
  }
  if (!$line) {
    var $template = $modal.find('#config_modal_site_line_template');
    $line = $template.clone().removeAttr('id');
    $form.append($line);
  }
  $line.find('input[name=label]').val(site['label']);
  $line.find('input[name=url]').val(site['url']);
  $line.find('select[name=type]').val(site['type'] || 'gerrit');
  $line.find('.close').click(stijl.ui.config.handleConfigRemoveSiteButton_);
  stijl.ui.config.renumberConfigSiteLines_();
};

stijl.ui.config.clearConfigSiteLines_ = function() {
  var $modal = $('#config_modal');
  var $form = $modal.find('.modal-body form').first();
  $form.find('.config-modal-site-line').remove();
};

stijl.ui.config.renumberConfigSiteLines_ = function() {
  var $modal = $('#config_modal');
  var $form = $modal.find('.modal-body form').first();
  $form.find('.config-modal-site-line').each(function(i) {
    var $line = $(this);
    $line.find('.form-index').text((i + 1) + '.');
  });
};

stijl.ui.config.handleConfigAddSiteButton_ = function() {
  stijl.ui.config.addConfigSiteLine_({});
};

stijl.ui.config.handleConfigRemoveSiteButton_ = function() {
  var $line = $(this).closest('.config-modal-site-line');
  $line.remove();
  stijl.ui.config.renumberConfigSiteLines_();
};

stijl.ui.config.handleConfigSaveButton_ = function() {
  var sites = [];
  var $modal = $('#config_modal');
  var $form = $modal.find('.modal-body form').first();
  $form.find('.config-modal-site-line').each(function() {
    var $line = $(this);
    var label = $line.find('input[name=label]').val();
    var url = $line.find('input[name=url]').val();
    var type = $line.find('select[name=type]').val();
    if (!label || !url || !type) {
      return;
    }
    var site = {label: label, url: url, type: type};
    sites.push(site);
  });
  stijl.permissions.request(sites).then(function() {
    chrome.storage.sync.set({sites: sites}, function() {
      $modal.modal('hide');
      stijl.ui.dashboard.update();
    });
  });
};

stijl.ui.config.handleConfigPresetButton_ = function() {
  var $button = $(this);
  var site = {
    label: $button.attr('data-label'),
    url: $button.attr('data-url'),
    type: $button.attr('data-type')
  };
  var exist = false;
  var $modal = $('#config_modal');
  var $form = $modal.find('.modal-body form').first();
  $form.find('.config-modal-site-line').each(function() {
    var $line = $(this);
    if ($line.find('input[name=url]').val() == site['url']) {
      exist = true;
      return true;
    }
  });
  if (!exist) {
    stijl.ui.config.addConfigSiteLine_(site);
  }
};


////////////////////////////////////////////////////////////////////////////////
// stijl.ui.misc

stijl.ui.misc = stijl.ui.misc || {};

stijl.ui.misc.installHandlers = function() {
  $('#permission_modal_continue').click(stijl.ui.misc.handlePermissionContinueButton_);
};

stijl.ui.misc.showPermissionRequiredModal = function() {
  $('#permission_modal').modal('show');
};

stijl.ui.misc.handlePermissionContinueButton_ = function() {
  stijl.storage.getConfiguredSites().then(function(sites) {
    return stijl.permissions.request(sites);
  }).then(function() {
    $('#permission_modal').modal('hide');
    stijl.ui.dashboard.update();
  });
};


////////////////////////////////////////////////////////////////////////////////
// main

stijl.ui.installHandlers();
stijl.ui.dashboard.update();
