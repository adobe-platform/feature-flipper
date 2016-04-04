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
import EventEmitter from 'events'
import assign from 'object-assign'
import async from 'async'
import Immutable from 'immutable'

const AppDispatcher = require('../dispatcher/AppDispatcher');
const FFActions = require('../actions/FFActions');
const ApiClient = require('../ApiClient');
const ActionTypes = require('../constants/ActionTypes');

const ViewStore = assign({}, EventEmitter.prototype);

ViewStore.NEW_CHANNEL_EVENT = 'vs.new-channel';
ViewStore.NEW_SET_EVENT = 'vs.new-set';
ViewStore.NEW_FEATURE_EVENT = 'vs.new-feature';
ViewStore.NEW_ALIAS_EVENT = 'vs.new-alias';
ViewStore.DELETE_SOMETHING = 'vs.delete';

var _currentDeleteAction = null

ViewStore.dispatchToken = AppDispatcher.register(function(e)
{
  switch(e.actionType)
  {
    case ActionTypes.NEW_CHANNEL:
      ViewStore.emit(ViewStore.NEW_CHANNEL_EVENT);
      break;

    case ActionTypes.NEW_FEATURE:
      ViewStore.emit(ViewStore.NEW_FEATURE_EVENT);
      break;

    case ActionTypes.NEW_ALIAS:
      ViewStore.emit(ViewStore.NEW_ALIAS_EVENT);
      break;

    case ActionTypes.NEW_SET:
      ViewStore.emit(ViewStore.NEW_SET_EVENT);
      break;

    case ActionTypes.DELETE_SOMETHING_PROMPT:
      _currentDeleteAction = e.payload.confirmFunc;
      ViewStore.emit(ViewStore.DELETE_SOMETHING, e.payload.prompt);
      break;

    case ActionTypes.DELETE_SOMETHING_CONFIRM:
      if (_currentDeleteAction)
      {
        setTimeout(() => {
          _currentDeleteAction();
        })
      }
      break;

    case ActionTypes.DELETE_SOMETHING_CANCEL:
      _currentDeleteAction = null;
      break;
  }
});

module.exports = ViewStore;
