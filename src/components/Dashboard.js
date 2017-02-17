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

import ChangeTableContainer from '../containers/ChangeTableContainer';
import ConfigModalContainer from '../containers/ConfigModalContainer';
import PermissionModalContainer from '../containers/PermissionModalContainer';
import StatusBarContainer from '../containers/StatusBarContainer';
import Footer from '../components/Footer';

const Dashboard = () => (
  <div className="container-fluid">
    <div className="page-header">
      <h1>Code Reviews</h1>
    </div>
    <div className="row">
      <div className="col-sm-12">
        <StatusBarContainer />
        <ChangeTableContainer />
      </div>
    </div>
    <ConfigModalContainer />
    <PermissionModalContainer />
    <Footer />
  </div>
);

export default Dashboard;
