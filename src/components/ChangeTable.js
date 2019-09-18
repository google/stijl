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

import * as util from '../util';

const HeaderRow = ({ children }) => (
  <tr>
    <td colSpan="5" style={{ backgroundColor: '#f4f4f4', fontWeight: 'bold' }}>
      { children }
    </td>
  </tr>
);

const ChangeRow = ({ change }) => (
  <tr className="change">
    <td>
      <a href={change.url} target="_blank" title={change.subject}>
        {change.subject}
      </a>
    </td>
    <td>
      <div className={`status-marker status-marker-${change.status}`} />
      {change.status}
    </td>
    <td>
      <span title={change.ownerName}>{change.ownerName}</span>
    </td>
    <td>
      <span title={change.repository}>{change.repository}</span>
    </td>
    <td>
      {util.formatPrettyTime(change.updated)}
    </td>
  </tr>
);

const SpacingRow = () => (
  <tr>
    <td colSpan="5" style={{ border: '0', backgroundColor: 'white' }}></td>
  </tr>
);

const ChangeSubtable = ({ caption, changes }) => {
  const rows = changes.map(
    (change) => <ChangeRow key={change.url} change={change} />);
  return (
    <tbody style={{ borderTop: '0' }}>
      <HeaderRow>{ caption }</HeaderRow>
      { rows }
      <SpacingRow />
    </tbody>
  );
};

class ChangeTable extends React.Component {
  render() {
    const changesByCategory = {
      outgoing: [],
      incoming: [],
      pending: [],
      submitted: [],
      cced: [],
    };
    for (const change of this.props.changes) {
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
    }
    for (const key of Object.keys(changesByCategory)) {
      changesByCategory[key].sort((a, b) => {
        if (a['updated'] < b['updated']) {
          return 1;
        }
        if (a['updated'] > b['updated']) {
          return -1;
        }
        return 0;
      });
    }
    return (
      <table className="table table-hover table-bordered table-condensed
                        review-table">
        <colgroup>
          <col style={{ width: 'auto' }} />
          <col style={{ width: '110px' }} />
          <col style={{ width: '160px' }} />
          <col style={{ width: 'auto' }} />
          <col style={{ width: '96px' }} />
        </colgroup>
        <ChangeSubtable
          caption="Incoming reviews"
          changes={changesByCategory.incoming}
        />
        <ChangeSubtable
          caption="Outgoing reviews"
          changes={changesByCategory.outgoing}
        />
        <ChangeSubtable
          caption="CC'ed reviews"
          changes={changesByCategory.cced}
        />
        <ChangeSubtable
          caption="Pending reviews"
          changes={changesByCategory.pending}
        />
        <ChangeSubtable
          caption="Recently submitted"
          changes={changesByCategory.submitted}
        />
      </table>
    );
  }
}

export default ChangeTable;
