Stijl
=====

Stijl is a dashboard showing all code reviews at multiple code review
websites in a single page.


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

Shuhei Takahashi

- Website: https://nya3.jp/
- Twitter: https://twitter.com/nya3jp/


Disclaimer
----------

This library is authored by a Googler and copyrighted by Google, but
is not an official Google product.


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
