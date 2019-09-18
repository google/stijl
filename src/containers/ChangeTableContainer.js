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

import * as ReactRedux from 'react-redux';

import ChangeTable from '../components/ChangeTable';

const mapStateToProps = ({ activeChangesBySite }) => {
  const allChanges = [];
  for (const changes of Object.values(activeChangesBySite)) {
    allChanges.push(...changes);
  }
  return { changes: allChanges };
};
const mapDispatchToProps = (dispatch) => ({});

const ChangeTableContainer =
    ReactRedux.connect(mapStateToProps, mapDispatchToProps)(ChangeTable);

export default ChangeTableContainer;
