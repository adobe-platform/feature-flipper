/*
 *  Copyright 2016 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the License for the specific language
 *  governing permissions and limitations under the License.
 */
var keyMirror = require('keymirror');

module.exports = keyMirror({
  SELECT_CHANNEL: null,
  CREATE_CHANNEL: null,
  SELECT_SET: null,

  CHANNEL_CREATED: null,

  SET_CREATED: null,

  DELETE_FEATURE: null,
  CREATE_FEATURE: null,

  CREATE_FEATURE_SET: null,
  DELETE_FEATURE_SET: null,
  SAVE_FEATURE_CHANGE: null,

  DELETE_ALIAS: null,
  CREATE_ALIAS: null,

  FETCH_CHANNELS: null,

  // view actions
  // TODO find a better place for these
  NEW_ALIAS: null,
  NEW_FEATURE: null,
  NEW_CHANNEL: null,
  NEW_SET: null,

  DELETE_SOMETHING_PROMPT: null,
  DELETE_SOMETHING_CONFIRM: null
});
