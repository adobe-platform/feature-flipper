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

var currentSetData = Immutable.Map();

const FeatureDataStore = assign({}, EventEmitter.prototype);

FeatureDataStore.SET_DATA_CHANGE_EVENT = 'fds.set-data';
FeatureDataStore.NOTIFICATION_EVENT = 'fds.notify';

const DEFAULT_FEATURE = {
  "description": "",
  "pctUsers": 0
};

FeatureDataStore.invalidateSetData = () => {
  currentSetData = Immutable.Map();

  let channelSet = SelectionStore.getCurrentChannelSet();
  if (!channelSet)
  {
    FeatureDataStore.emit(FeatureDataStore.SET_DATA_CHANGE_EVENT);
    return;
  }

  ApiClient.getFeatureSet(channelSet)
  .success((data, status, xhr) => {

    currentSetData = Immutable.fromJS(data);
    var sortedFeatures = currentSetData.get('features').sortBy((v, k) => {
      return k;
    }, (a, b) => {
      return a > b;
    });
    currentSetData = currentSetData.set('features', sortedFeatures);

    FeatureDataStore.emit(FeatureDataStore.SET_DATA_CHANGE_EVENT);
  })
}

FeatureDataStore.getCurrentSetData = () => {
  return currentSetData;
}

FeatureDataStore.saveCurrentSet = (msg) => {

  const setId = SelectionStore.getCurrentChannelSet();

  ApiClient.putFeatureSet(setId, currentSetData.toJS())
  .success((data, status, xhr) => {

    if (msg)
    {
      FeatureDataStore.emit(FeatureDataStore.NOTIFICATION_EVENT, msg);
    }
  }).error((xhr) => {
    if (xhr.status == 409)
    {
      FeatureDataStore.invalidateSetData();
      FeatureDataStore.emit(FeatureDataStore.NOTIFICATION_EVENT, 'This data was out of date. Refreshing');
    }
    else
    {
      FeatureDataStore.emit(FeatureDataStore.NOTIFICATION_EVENT, 'FAILED to save ' + setId);
    }
  })
  .complete(() => {
    FeatureDataStore.emit(FeatureDataStore.SET_DATA_CHANGE_EVENT);
  })
}

FeatureDataStore.createFeature = (featureName) => {

  var featureData = Immutable.fromJS(DEFAULT_FEATURE);
  currentSetData = currentSetData.setIn(['features', featureName], featureData);
  FeatureDataStore.saveCurrentSet("Created feature " + featureName);

}

FeatureDataStore.deleteFeature = (featureName) => {

  currentSetData = currentSetData.deleteIn(['features', featureName]);
  FeatureDataStore.saveCurrentSet("Deleted feature " + featureName);
}

FeatureDataStore.dispatchToken = AppDispatcher.register(function(e)
{
  switch(e.actionType)
  {
    case ActionTypes.SAVE_FEATURE_CHANGE:

      var featureName = e.payload.featureName;
      var featureData = e.payload.featureData;
      currentSetData = currentSetData.setIn(['features', featureName], featureData);

      FeatureDataStore.saveCurrentSet();
      break;

    case ActionTypes.CHANNEL_CREATED:
      FeatureDataStore.createChannel(e.payload);
      break;

    case ActionTypes.CREATE_FEATURE:
      FeatureDataStore.createFeature(e.payload);
      break;

    case ActionTypes.DELETE_FEATURE:
      FeatureDataStore.deleteFeature(e.payload);
      break;

    case ActionTypes.SELECT_SET:
      AppDispatcher.waitFor([SelectionStore.dispatchToken]);
      FeatureDataStore.invalidateSetData();
      break;
  }
});

module.exports = FeatureDataStore;
