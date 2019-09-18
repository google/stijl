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

import React from 'react';
import partialUpdate from 'react-addons-update';
import { Button, Modal } from 'react-bootstrap';

import * as constants from '../constants';

const EMPTY_SITE = {
  label: '',
  url: '',
  type: 'gerrit',
};

const SiteLine = ({ index, label, url, type, onFormChange, onRemove }) => (
  <div className="config-modal-site-line">
    {index + 1}. {' '}
    <input type="text"
      className="form-control"
      placeholder="Label"
      style={{ display: 'inline-block', width: '120px' }}
      value={label}
      onChange={(e) => onFormChange('label', e.target.value)} />
    <input type="text"
      className="form-control"
      placeholder="URL"
      style={{ display: 'inline-block', width: '300px' }}
      value={url}
      onChange={(e) => onFormChange('url', e.target.value)} />
    <select className="form-control"
      style={{ display: 'inline-block', width: '100px' }}
      value={type}
      onChange={(e) => onFormChange('type', e.target.value)} >
      <option value="gerrit">Gerrit</option>
    </select>
    <button type="button"
      className="close"
      style={{ position: 'relative', top: '4px' }}
      onClick={() => onRemove()}>
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
);

class ConfigModalImpl extends React.Component {
  componentWillMount() {
    let { sites } = this.props;
    if (sites.length == 0) {
      sites = partialUpdate(sites, {$push: [EMPTY_SITE]});
    }
    this.setState({ sites });
  }

  addSite(site) {
    if (site.label !== '' &&
        this.state.sites[this.state.sites.length - 1] === EMPTY_SITE) {
      this.setState({
        sites: partialUpdate(this.state.sites, {
          $splice: [[this.state.sites.length - 1, 1, site]],
        }),
      });
    } else {
      this.setState({
        sites: partialUpdate(this.state.sites, {
          $push: [site],
        }),
      });
    }
  }

  removeSite(index) {
    if (this.state.sites.length == 1) {
      this.setState({
        sites: [EMPTY_SITE],
      });
    } else {
      this.setState({
        sites: partialUpdate(this.state.sites, {
          $splice: [[index, 1]],
        }),
      });
    }
  }

  changeSite(index, key, value) {
    this.setState({
      sites: partialUpdate(this.state.sites, {
        [index]: {
          [key]: {$set: value},
        },
      }),
    });
  }

  save() {
    const sites = this.buildSitesConfig();
    if (sites) {
      this.props.onSave(sites);
    }
  }

  buildSitesConfig() {
    let valid = true;
    const sites = [];
    const seenLabels = {};
    for (const site of this.state.sites) {
      const { label } = site;
      if (label.length == 0) {
        return;
      } else if (seenLabels[label]) {
        valid = false;
      } else {
        sites.push(site);
        seenLabels[label] = true;
      }
    }
    return valid ? sites : null;
  }

  render() {
    const siteLines = this.state.sites.map((site, index) => {
      return (
        <SiteLine key={index}
          index={index}
          label={site.label}
          url={site.url}
          type={site.type}
          onFormChange={
            (key, value) => this.changeSite(index, key, value)}
          onRemove={() => this.removeSite(index)} />
      );
    });
    const presetLinks = [];
    for (const preset of constants.PRESETS) {
      if (presetLinks.length > 0) {
        presetLinks.push(', ');
      }
      presetLinks.push(
        <a key={preset.label}
          href="javascript:void(0)"
          onClick={() => this.addSite(preset)}>
          {preset.name}
        </a>
      );
    }
    return (
      <Modal show={true}
        onHide={() => this.props.onCancel()}
        style={{ width: '600px', margin: '0 auto' }}>
        <Modal.Header>
          <Modal.Title>Configure Code Review Sites</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form className="form-inline">
            {siteLines}
          </form>
          <form className="form-inline" style={{ overflow: 'hidden' }}>
            <button type="button"
              className="close"
              style={{ marginTop: '4px' }}
              onClick={() => this.addSite(EMPTY_SITE)} >
              +
            </button>
            <div style={{ margin: '10px 0 -2px', fontSize: '9pt' }}>
              Add preset sites:
              {' '}
              {presetLinks}
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="default" onClick={() => this.props.onCancel()}>
            Cancel
          </Button>
          <Button bsStyle="primary" onClick={() => this.save()}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

const ConfigModal = ({ show, ...props }) => {
  if (!show) {
    return null;
  }
  return <ConfigModalImpl {...props} />;
};

export default ConfigModal;
