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
var AppDispatcher = require('../dispatcher/AppDispatcher');
var ActionTypes = require('../constants/ActionTypes');

var FeatureFlipperActions = {

  newChannel: function(setName) {
    AppDispatcher.dispatch({
      actionType: ActionTypes.NEW_CHANNEL
    });
  },

  newSet: function() {
    AppDispatcher.dispatch({
      actionType: ActionTypes.NEW_SET
    });
  },

  newFeature: function() {
    AppDispatcher.dispatch({
      actionType: ActionTypes.NEW_FEATURE
    });
  },

  newAlias: function() {
    AppDispatcher.dispatch({
      actionType: ActionTypes.NEW_ALIAS
    });
  },

  setCreated: function() {
    AppDispatcher.dispatch({
      actionType: ActionTypes.SET_CREATED
    });
  },

  selectSet: function(setName) {
    AppDispatcher.dispatch({
      actionType: ActionTypes.SELECT_SET,
      payload: setName
    });
  },

  selectChannel: function(channelName) {
    AppDispatcher.dispatch({
      actionType: ActionTypes.SELECT_CHANNEL,
      payload: channelName
    });
  },

  createChannel: function(channelName) {
    AppDispatcher.dispatch({
      actionType: ActionTypes.CREATE_CHANNEL,
      payload: channelName
    });
  },

  channelCreated: function(channelName) {
    AppDispatcher.dispatch({
      actionType: ActionTypes.CHANNEL_CREATED,
      payload: channelName
    });
  },

  fetchChannels: function() {
    AppDispatcher.dispatch({
      actionType: ActionTypes.FETCH_CHANNELS
    });
  },

  createFeatureSet: function(setName) {
    AppDispatcher.dispatch({
      actionType: ActionTypes.CREATE_FEATURE_SET,
      payload: setName
    });
  },

  createFeature: function(featureName) {
    AppDispatcher.dispatch({
      actionType: ActionTypes.CREATE_FEATURE,
      payload: featureName
    });
  },

  deleteFeature: function(featureName) {
    AppDispatcher.dispatch({
      actionType: ActionTypes.DELETE_FEATURE,
      payload: featureName
    });
  },

  deleteAlias: function(alias) {
    AppDispatcher.dispatch({
      actionType: ActionTypes.DELETE_ALIAS,
      payload: alias
    });
  },

  createAlias: function(alias) {
    AppDispatcher.dispatch({
      actionType: ActionTypes.CREATE_ALIAS,
      payload: alias
    });
  },

  saveFeatureChange: function(featureName, featureData) {
    AppDispatcher.dispatch({
      actionType: ActionTypes.SAVE_FEATURE_CHANGE,
      payload: {
        featureName: featureName,
        featureData: featureData
      }
    });
  },

  deleteFeatureSet: function() {
    AppDispatcher.dispatch({
      actionType: ActionTypes.DELETE_FEATURE_SET
    });
  }

};
module.exports = FeatureFlipperActions;
