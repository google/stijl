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

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const fillZeros = (number, digits) => {
  const s = Array(digits).join('0') + number;
  return s.slice(s.length - digits);
};

export const formatPrettyTime = (timestamp) => {
  const date = new Date(timestamp);
  const deltaInMillis = Date.now() - timestamp;
  if (deltaInMillis < 0) {
    return 'future';
  } else if (deltaInMillis < 20 * 60 * 60 * 1000) {
    return '' + date.getHours() + ':' + fillZeros(date.getMinutes(), 2);
  } else if (deltaInMillis < 340 * 24 * 60 * 60 * 1000) {
    return '' + MONTHS[date.getMonth()] + ' ' + date.getDate();
  }
  return '' + MONTHS[date.getMonth()] + ' ' + date.getDate() + ' ' +
      date.getFullYear();
};

/**
 * @param {number} duration - The duration to wait for in milliseconds.
 * @return Promise to wait for |duration| milliseconds, and then to resolve.
 *     If |duration| is nagative, the returned instance will be rejected.
 */
export const sleep = (duration) => {
  return new Promise((resolve, reject) => {
    if (duration < 0) {
      reject(new Error('Nagative duration: ' + duration));
      return;
    }
    setTimeout(resolve, duration);
  });
};
