Stijl
=====

Stijl is a Chrome extension to show all your code reviews across multiple code review websites.


Installation
------------

Latest release of Stijl can be installed from
[Chrome Web Store](https://chrome.google.com/webstore/detail/stijl/cpbiadoobgnpcacjecphfeoonpfccagk).


Screenshot
----------

![Screenshot](https://raw.githubusercontent.com/google/stijl/master/misc/screenshot1.png)


How to Build
------------

For development, you usually want to use `watchify` to incrementally
build JS as you make changes to the source code.

```
$ npm install    # Takes minutes and needs ~500MB disk space
$ npm run watch  # Takes a minute to build first time
```

Then drag and drop `extension` directory to chrome://extensions to
register as an unpacked extension.


Author
------

Stijl is originally authored by [Shuhei Takahashi](https://nya3.jp).
The list of contributers can be seen at [GitHub](https://github.com/google/stijl/graphs/contributors).

Stijl is copyrighted by Google, but not an official Google product.


License
-------

Copyright 2016 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
