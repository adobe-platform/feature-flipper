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
import React from 'react'
const _ = require('underscore');
import Immutable from 'immutable'

const SelectionStore = require('../stores/SelectionStore');
const FeatureDataStore = require('../stores/FeatureDataStore');

const DiffSetDropDown = require('./DiffSetDropDown');
const DiffFeatureList = require('./DiffFeatureList');

const DiffSetView = React.createClass({

  render: function () {
    // console.log("DiffSetView render");

    FeatureDataStore.setFeatureSets(SelectionStore.getFeatureSets(), SelectionStore.getCurrentSet());
    var centerText = FeatureDataStore.getSetAName() + ' ∩ ' + FeatureDataStore.getSetBName();
    var centerTitleText = 'This is the intersection of features in ' + FeatureDataStore.getSetAName() + ' and ' + FeatureDataStore.getSetBName();

    return (
      <div>

        <div className="col-md-4">
          <DiffSetDropDown className="pull-right"
                           getFeatureSets={FeatureDataStore.getAFeatureSets}
                           getCurrentSet={FeatureDataStore.getSetAName}
                           setCurrentSet={FeatureDataStore.setSetAName}
                           setChangeEvent={FeatureDataStore.SET_A_CHANGE_EVENT} />

        </div>

        <div className="col-md-4">
          <p className="text-center" title={centerTitleText}>{centerText}</p>
        </div>

        <div className="col-md-4">
          <DiffSetDropDown getFeatureSets={FeatureDataStore.getBFeatureSets}
                           getCurrentSet={FeatureDataStore.getSetBName}
                           setCurrentSet={FeatureDataStore.setSetBName}
                           setChangeEvent={FeatureDataStore.SET_B_CHANGE_EVENT} />

        </div>

        <div className="col-md-4">
          <DiffFeatureList dataProvider={FeatureDataStore.aSubB}
                           onRightClick={this._onASubBClick} />
        </div>

        <div className="col-md-4 ff-diff-middle">

          <DiffFeatureList dataProvider={FeatureDataStore.aIntersectB}
                           onRightClick={this._onIntersectionRightClick}
                           onLeftClick={this._onIntersectionLeftClick} />
        </div>

        <div className="col-md-4">
          <DiffFeatureList dataProvider={FeatureDataStore.bSubA}
                           onLeftClick={this._onBSubAClick} />
        </div>

      </div>
    );
  },

  _onASubBClick: function (key) {
    return function () {
      // console.log("_onASubBClick", key);
      FeatureDataStore.addFeatureToSetB(key);
    }
  },

  _onIntersectionLeftClick: function (key) {
    return function () {
      // console.log("_onIntersectionLeftClick", key);
      FeatureDataStore.removeFeatureFromSetB(key);
    }
  },

  _onIntersectionRightClick: function (key) {
    return function () {
      // console.log("_onIntersectionRightClick", key);
      FeatureDataStore.removeFeatureFromSetA(key);
    }
  },

  _onBSubAClick: function (key) {
    return function () {
      // console.log("_onBSubAClick", key);
      FeatureDataStore.addFeatureToSetA(key);
    }
  },

});

module.exports = DiffSetView;
