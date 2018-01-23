// Copyright 2017 Google Inc.
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

import * as globals from '../globals';

const Footer = () => {
  const version =
    globals.extensionInfo.installType === 'development' ?
      'dev' : `v${globals.extensionInfo.version}`;
  return (
    <footer className="page-footer" style={{ marginTop: '-18px' }}>
      <span>Stijl ({version}).</span>
      {' '}
      <span>Code is on</span>
      {' '}
      <a href="https://github.com/google/stijl/"
        target="_blank"
        style={{ color: 'inherit' }}>
        GitHub
      </a>.
    </footer>
  );
};

export default Footer;
