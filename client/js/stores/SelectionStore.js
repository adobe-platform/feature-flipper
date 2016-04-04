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

var channelToFeatureSets = Immutable.Map();

var currentSet = null;
var currentChannel = null;

const SelectionStore = assign({}, EventEmitter.prototype);

SelectionStore.SET_CHANGE_EVENT = 'ss.set-list';
SelectionStore.CHANNEL_CHANGE_EVENT = 'ss.channel-list';
SelectionStore.NOTIFICATION_EVENT = 'ss.notify';

// regex matches private/lambda_function.py#post_set
SelectionStore.CHANNEL_RE = /^\w+\-[A-Za-z](\w|\-)*$/;
// - is reserved to distinguish channels from sets
SelectionStore.SET_RE = /^[A-Za-z](\w|\.)*$/;
SelectionStore.FEATURE_RE = /^[A-Za-z](\w|\.)*$/;

const DEFAULT_SET = 'default'

//
// Feature sets API
//

SelectionStore.getFeatureSets = () => {
  const list = channelToFeatureSets.get(currentChannel) || Immutable.List();
  return list.sort()
}

SelectionStore.getCurrentSet = () => {
  return currentSet;
}

SelectionStore.addFeatureSet = (setName) => {
  featureSets = featureSets.push(setName);
  FFActions.selectSet(setName);
}

SelectionStore.deleteFeatureSet = () => {

  ApiClient.deleteFeatureSet(SelectionStore.getCurrentChannelSet())
  .success((data, status, xhr) => {

    let featureSets = SelectionStore.getFeatureSets();
    let setIndex = featureSets.indexOf(currentSet);
    if (setIndex > -1)
    {
      featureSets = featureSets.delete(setIndex);
    }
    channelToFeatureSets = channelToFeatureSets.set(currentChannel, featureSets);

    var newCurrentSet = featureSets.first();
    if (newCurrentSet)
    {
      FFActions.selectSet(newCurrentSet);
    }
    else
    {
      FFActions.fetchChannels();
    }
  })
}

SelectionStore.setCurrentSet = (set) => {
  let featureSets = channelToFeatureSets.get(currentChannel);
  if (featureSets && featureSets.includes(set))
  {
    currentSet = set;
    SelectionStore.emit(SelectionStore.SET_CHANGE_EVENT);
  }
}

//
// Channels API
//

SelectionStore.getChannelNames = () => {
  return Immutable.List(channelToFeatureSets.keys()).sort();
}

SelectionStore.getCurrentChannel = () => {
  return currentChannel;
}

SelectionStore.getCurrentChannelSet = () => {
  return currentChannel + '-' + currentSet;
}

SelectionStore.addChannel = (channel) => {
  channelToFeatureSets = channelToFeatureSets.set(channel, Immutable.List());
  SelectionStore.setCurrentChannel(channel);
}

SelectionStore.setCurrentChannel = (channel) => {
  if (channelToFeatureSets.has(channel))
  {
    currentChannel = channel;
    SelectionStore.emit(SelectionStore.CHANNEL_CHANGE_EVENT);

    let set = channelToFeatureSets.get(channel).first();
    // setCurrentChannel is sometimes called on a AppDispatcher.dispatch() stack
    //
    // break out of that stack to do another dispatch() or get an invariant
    // violation
    setTimeout(() => {
      FFActions.selectSet(set);
    })
  }
}

SelectionStore.createChannel = (channel) => {
  if (!SelectionStore.CHANNEL_RE.test(channel))
  {
    console.error('invalid channel name. this should have already been validated');
    return
  }

  const channelSet = [channel, DEFAULT_SET].join('-');
  ApiClient.postFeatureSet(channelSet)
  .success((data, status, xhr) => {

    channelToFeatureSets = channelToFeatureSets.set(channel, Immutable.List([DEFAULT_SET]))
    SelectionStore.setCurrentChannel(channel);
    SelectionStore.emit(SelectionStore.NOTIFICATION_EVENT, 'Created channel ' + channel);
  })
}

SelectionStore.createFeatureSet = (setName) => {
  if (!SelectionStore.SET_RE.test(setName))
  {
    console.error('invalid feature set name. this should have already been validated');
    return
  }

  const channelSet = [currentChannel, setName].join('-');
  ApiClient.postFeatureSet(channelSet)
  .success((data, status, xhr) => {

    let featureSets = channelToFeatureSets.get(currentChannel);
    featureSets = featureSets.push(setName)
    channelToFeatureSets = channelToFeatureSets.set(currentChannel, featureSets);
    FFActions.selectSet(setName);
    SelectionStore.emit(SelectionStore.NOTIFICATION_EVENT, 'Created feature set ' + setName);
  })
}

//
// Private methods
//

function _getFeatureSets() {

  ApiClient.getFeatureSets()
  .success(function (data, status, xhr) {

    channelToFeatureSets = Immutable.OrderedMap();
    var firstChannel = 'z';
    if (data && data.featureSets)
    {
      for (var i = 0; i < data.featureSets.length; i++) {
        // EnvironmentName-Service-Name-FeatureSetName
        let envServiceSet = data.featureSets[i];

        let parts = envServiceSet.split('-');
        let featureSet = parts.pop();
        let channelName = parts.join('-');
        if (channelName < firstChannel)
        {
          firstChannel = channelName;
        }

        var featureSets = channelToFeatureSets.get(channelName) || Immutable.List();
        featureSets = featureSets.push(featureSet);

        channelToFeatureSets = channelToFeatureSets.set(channelName, featureSets);
      };
    }

    // cause cache invalidation
    SelectionStore.setCurrentChannel(firstChannel);
  })
}

SelectionStore.dispatchToken = AppDispatcher.register(function(e)
{
  switch(e.actionType)
  {
    case ActionTypes.FETCH_CHANNELS:
      _getFeatureSets();
      break;

    case ActionTypes.CREATE_CHANNEL:
      SelectionStore.createChannel(e.payload);
      break;

    case ActionTypes.CREATE_FEATURE_SET:
      SelectionStore.createFeatureSet(e.payload);
      break;

    case ActionTypes.DELETE_FEATURE_SET:
      SelectionStore.deleteFeatureSet();
      break;

    case ActionTypes.SELECT_CHANNEL:
      SelectionStore.setCurrentChannel(e.payload)
      break;

    case ActionTypes.SELECT_SET:
      SelectionStore.setCurrentSet(e.payload)
      break;

  }
});

module.exports = SelectionStore;
