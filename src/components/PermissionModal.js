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
import { Button, Modal } from 'react-bootstrap';

const PermissionModal = ({ show, sites, onContinue }) => (
  <Modal show={show} backdrop="static">
    <Modal.Header>
      <Modal.Title>Permission Required</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      Permissions to access to code review sites have not been granted yet.
      Please click the continue button and you will be asked for permissions.
    </Modal.Body>
    <Modal.Footer>
      <Button bsStyle="primary" onClick={() => onContinue(sites)}>
        Continue
      </Button>
    </Modal.Footer>
  </Modal>
);

export default PermissionModal;
