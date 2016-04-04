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
import assign from 'object-assign'
import async from 'async'
import Immutable from 'immutable'
import EventEmitter from 'events'

const AppDispatcher = require('../dispatcher/AppDispatcher');
const ActionTypes = require('../constants/ActionTypes');
const ApiClient = require('../ApiClient');
const SelectionStore = require('./SelectionStore');

var currentAliases = Immutable.List();

const AliasStore = assign({}, EventEmitter.prototype);

AliasStore.NOTIFICATION_EVENT = 'as.notify';
AliasStore.ALIAS_CHANGE_EVENT = 'as.change';

const DEFAULT_FEATURE = {
  "description": "",
  "pctUsers": 0
};

function _invalidateAliases() {

  let channelSet = SelectionStore.getCurrentChannelSet();
  if (!channelSet)
  {
    AliasStore.emit(AliasStore.ALIAS_CHANGE_EVENT);
    return;
  }

  ApiClient.getAliases(channelSet)
  .success((data, status, xhr) => {

    currentAliases = Immutable.fromJS(data.aliases).sort();

    AliasStore.emit(AliasStore.ALIAS_CHANGE_EVENT);
  })
}

AliasStore.getAliases = () => {
  return currentAliases;
}

AliasStore.deleteAlias = (aliasName) => {

  ApiClient.deleteAlias(aliasName)
  .success((data, status, xhr) => {

    let i = currentAliases.indexOf(aliasName);
    if (i > -1)
    {
      currentAliases = currentAliases.delete(i);
    }

    AliasStore.emit(AliasStore.ALIAS_CHANGE_EVENT);
    AliasStore.emit(AliasStore.NOTIFICATION_EVENT, 'Deleted ' + aliasName);
  })

}

AliasStore.createAlias = (aliasName) => {

  let channelSet = SelectionStore.getCurrentChannelSet();
  if (!channelSet)
  {
    AliasStore.emit(AliasStore.ALIAS_CHANGE_EVENT);
    return;
  }

  ApiClient.postAlias(channelSet, aliasName)
  .success((data, status, xhr) => {

    currentAliases = currentAliases.push(aliasName).sort();

    AliasStore.emit(AliasStore.NOTIFICATION_EVENT, 'Created ' + aliasName);
  })
  .error((xhr) => {
    if (xhr.status == 409)
    {
      AliasStore.emit(AliasStore.NOTIFICATION_EVENT, 'Alias ' + aliasName + ' exists on another feature set');
    }
  })
  .complete(() => {
    AliasStore.emit(AliasStore.ALIAS_CHANGE_EVENT);
  })

}

AliasStore.dispatchToken = AppDispatcher.register(function(e)
{
  switch(e.actionType)
  {
    case ActionTypes.SELECT_SET:
      AppDispatcher.waitFor([SelectionStore.dispatchToken]);
      _invalidateAliases();
      break;

    case ActionTypes.DELETE_ALIAS:
      AliasStore.deleteAlias(e.payload);
      break;

    case ActionTypes.CREATE_ALIAS:
      AliasStore.createAlias(e.payload);
      break;
  }
});

module.exports = AliasStore;
