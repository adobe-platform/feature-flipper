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

// This file is ridiculously and intentionally verbose.
// It's also incredibly debuggable.
// I opted for obviousness and clarity over cleverness.

import assign from 'object-assign'
import async from 'async'
import _ from 'underscore'
import EventEmitter from 'events'
import Immutable from 'immutable'

const AppDispatcher = require('../dispatcher/AppDispatcher');
const ApiClient = require('../ApiClient');
const ActionTypes = require('../constants/ActionTypes');
const SelectionStore = require('./SelectionStore');

var featureSets = Immutable.List();

var setAName = null;
var setAData = Immutable.Map();
var setAFeatures = Immutable.Set();

var setBName = null;
var setBData = Immutable.Map();
var setBFeatures = Immutable.Set();

const FeatureDataStore = assign({}, EventEmitter.prototype);

FeatureDataStore.SET_A_DATA_CHANGE_EVENT = 'set-a-data';
FeatureDataStore.SET_B_DATA_CHANGE_EVENT = 'set-b-data';
FeatureDataStore.SET_A_CHANGE_EVENT = 'set-a-list';
FeatureDataStore.SET_B_CHANGE_EVENT = 'set-b-list';

function invalidateSetData (setName) {
  if (setName == setAName)
  {
    setAData = Immutable.Map();
  }
  else if (setName == setBName)
  {
    setBData = Immutable.Map();
  }
  else
  {
    throw "can't invalidate invalid set name " + setName;
  }

  // TODO do this in SelectionStore
  var channelSet = SelectionStore.getCurrentChannel() + '/' + setName;

  ApiClient.getKeyData(channelSet)
  .success(function (data, status, xhr) {

    var setObj;
    try
    {
      setObj = JSON.parse(data)
    }
    catch (e)
    {
      console.error("failed to parse json");
      console.log(e);
    }

    if (setName == setAName)
    {
      setAData = Immutable.fromJS(setObj);
      var sortedFeatures = setAData.get('features').sortBy(function (v, k) {
        return k;
      }, function (a, b) {
        return a > b;
      });
      setAData = setAData.set('features', sortedFeatures);
      invalidateFeaturesSetA();
    }
    else if (setName == setBName)
    {
      setBData = Immutable.fromJS(setObj);
      var sortedFeatures = setBData.get('features').sortBy(function (v, k) {
        return k;
      }, function (a, b) {
        return a > b;
      });
      setBData = setBData.set('features', sortedFeatures);
      invalidateFeaturesSetB();
    }
  })
}

function invalidateFeaturesSets () {
  invalidateFeaturesSetA();
  invalidateFeaturesSetB();
}

function invalidateFeaturesSetA () {
  setAFeatures = Immutable.Set();

  var iterator = setAData.get('features').keys();
  var next = iterator.next();
  while (!next.done) {
    setAFeatures = setAFeatures.add(next.value);
    next = iterator.next();
  }

  FeatureDataStore.emit(FeatureDataStore.SET_A_DATA_CHANGE_EVENT);
}

function invalidateFeaturesSetB () {
  setBFeatures = Immutable.Set();

  var iterator = setBData.get('features').keys();
  var next = iterator.next();
  while (!next.done) {
    setBFeatures = setBFeatures.add(next.value);
    next = iterator.next();
  }

  FeatureDataStore.emit(FeatureDataStore.SET_B_DATA_CHANGE_EVENT);
}

FeatureDataStore.getAFeatureSets = function () {
  var ret = featureSets.filter(function (k) {
    return k != setBName;
  });
  return ret;
}

FeatureDataStore.getBFeatureSets = function () {
  var ret = featureSets.filter(function (k) {
    return k != setAName;
  });
  return ret;
}

FeatureDataStore.getSetAName = function () {
  return setAName;
}

FeatureDataStore.getSetBName = function () {
  return setBName;
}

FeatureDataStore.setSetAName = function (name) {
  setAName = name;
  if (setAName)
  {
    FeatureDataStore.emit(FeatureDataStore.SET_A_CHANGE_EVENT);
    invalidateSetData(name);
  }
}

FeatureDataStore.setSetBName = function (name) {
  setBName = name;
  if (setBName)
  {
    FeatureDataStore.emit(FeatureDataStore.SET_B_CHANGE_EVENT);
    invalidateSetData(name);
  }
}

FeatureDataStore.setFeatureSets = function (sets, currentSet) {
  featureSets = sets;
  FeatureDataStore.setSetAName(currentSet);

  var otherSet = featureSets.filter(function (k) {
    return k != currentSet;
  }).first();
  FeatureDataStore.setSetBName(otherSet);
}

FeatureDataStore.aSubB = function () {
  var ret = setAFeatures.subtract(setBFeatures);
  return ret;
}

FeatureDataStore.aIntersectB = function () {
  var ret = setAFeatures.intersect(setBFeatures);
  return ret;
}

FeatureDataStore.bSubA = function () {
  var ret = setBFeatures.subtract(setAFeatures);
  return ret;
}

FeatureDataStore.addFeatureToSetA = function (featureName) {
  assert(setBFeatures.contains(featureName), "set B missing " + featureName);
  assert(!setAFeatures.contains(featureName), "set A has " + featureName);

  var featureData = setBData.getIn(['features', featureName]);
  setAData = setAData.setIn(['features', featureName], featureData);
  FeatureDataStore.saveFeatureSetData(setAName, setAData)
  .success(function (data, status, xhr) {
    invalidateFeaturesSetA();
  });
}

FeatureDataStore.removeFeatureFromSetA = function (featureName) {
  assert(setAFeatures.contains(featureName), "set A has " + featureName);

  setAData = setAData.deleteIn(['features', featureName]);
  FeatureDataStore.saveFeatureSetData(setAName, setAData)
  .success(function (data, status, xhr) {
    invalidateFeaturesSetA();
  });
}

FeatureDataStore.addFeatureToSetB = function (featureName) {
  assert(setAFeatures.contains(featureName), "set A missing " + featureName);
  assert(!setBFeatures.contains(featureName), "set B has " + featureName);

  var featureData = setAData.getIn(['features', featureName]);
  setBData = setBData.setIn(['features', featureName], featureData);
  FeatureDataStore.saveFeatureSetData(setBName, setBData)
  .success(function (data, status, xhr) {
    invalidateFeaturesSetB();
  });
}

FeatureDataStore.removeFeatureFromSetB = function (featureName) {
  assert(setBFeatures.contains(featureName), "set B has " + featureName);

  setBData = setBData.deleteIn(['features', featureName]);
  FeatureDataStore.saveFeatureSetData(setBName, setBData)
  .success(function (data, status, xhr) {
    invalidateFeaturesSetB();
  });
}

FeatureDataStore.saveFeatureSetData = function (setName, setData) {
  assert(setName === setAName || setName === setBName, "invalid set");

  var setDataJSON = JSON.stringify(setData.toJS());

  // TODO do this in SelectionStore
  var channelSet = SelectionStore.getCurrentChannel() + '/' + setName;

  return ApiClient.saveKeyData(channelSet, setDataJSON)
  .error(function (xhr) {
    if (xhr.status == 409)
    {
      invalidateSetData(set);
    }
    else
    {
      console.error('failed to save set ' + setName);
    }
  })
}

function assert (truth, msg) {
  if (!truth)
  {
    throw msg;
  }
}

module.exports = FeatureDataStore;
