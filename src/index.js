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

// This must come first.
import 'babel-polyfill';

import React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import * as Redux from 'redux';
import ReduxThunk from 'redux-thunk';

import * as actions from './actions';
import Dashboard from './components/Dashboard';
import * as persistence from './persistence';
import * as reducers from './reducers';

const store = Redux.createStore(
  reducers.rootReducer,
  Redux.applyMiddleware(ReduxThunk));

persistence.init(store).then(() => {
  if (store.getState().config.sites.length == 0) {
    store.dispatch(actions.showConfigModal());
  } else {
    store.dispatch(actions.refreshAll());
  }
});

const App = () => (
  <Provider store={store}>
    <Dashboard />
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));

// Show "dev" badge if the extension is installed as an unpacked extension.
chrome.management.getSelf((info) => {
  if (info.installType === 'development') {
    chrome.browserAction.setBadgeText({text: 'dev'});
  }
});
