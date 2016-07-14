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

if (window['ga'] === undefined) {
  window['GoogleAnalyticsObject'] = 'ga';
  window['ga'] = function() {
    (window['ga']['q'] = window['ga']['q'] || []).push(arguments);
  };
  window['ga']['l'] = new Date().valueOf();
}

window['ga']('create', 'UA-69761330-1', 'auto');
// Disable protocol checking. This allows Analytics to work from chrome://
window['ga']('set', 'checkProtocolTask', null);
window['ga']('send', 'pageview', '/dashboard.html');
