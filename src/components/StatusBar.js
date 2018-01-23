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

const StatusBar = ({ activeSites, onConfig }) => {
  const indicators = Object.values(activeSites).map((site) => {
    const color = (
      site.loading ? 'warning' : site.success ? 'success' : 'danger');
    return (
      <span key={site.label}
        className={`label label-${color}`}
        style={{ margin: '1px' }}>
        <a href={site.url} target="_blank" style={{ color: 'white' }}>
          {site.label}
        </a>
      </span>
    );
  });
  const spinner = (
    Object.values(activeSites).some((site) => site.loading) ?
      <img src="/assets/loading.gif" /> : null);
  return (
    <div className="well well-sm">
      Sites: {' '}
      <div style={{
        display: 'inline-block',
        position: 'relative',
        top: '-2px',
      }}>
        {indicators}
      </div>
      {spinner}
      <a href="javascript:void(0)"
        style={{ color: 'inherit', float: 'right' }}
        onClick={onConfig}>
        <span className="glyphicon glyphicon-cog"></span>
      </a>
    </div>
  );
};

export default StatusBar;
