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
import Immutable from 'immutable'

const FFActions = require('../actions/FFActions');
const FeatureDataStore = require('../stores/FeatureDataStore');
const DiffFeature = require('./DiffFeature');

const DiffFeatureList = React.createClass({

  propTypes: {
    dataProvider: React.PropTypes.func.isRequired,

    onRightClick: React.PropTypes.func,
    onLeftClick: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      dataProvider: Immutable.Set
    };
  },

  componentWillMount: function () {
    FeatureDataStore.on(FeatureDataStore.SET_A_DATA_CHANGE_EVENT, this._onDataChanged);
    FeatureDataStore.on(FeatureDataStore.SET_B_DATA_CHANGE_EVENT, this._onDataChanged);
  },

  componentWillUnmount: function () {
    FeatureDataStore.removeListener(FeatureDataStore.SET_A_DATA_CHANGE_EVENT, this._onDataChanged);
    FeatureDataStore.removeListener(FeatureDataStore.SET_B_DATA_CHANGE_EVENT, this._onDataChanged);
  },

  render: function () {
    // console.log("DiffFeatureList render");

    var self = this;

    var featureListItems = this.props.dataProvider().map(function (k) {
      var onLeftClick;
      var onRightClick;

      if (self.props.onLeftClick)
      {
        // create a function seeded with the current key
        onLeftClick = self.props.onLeftClick(k);
      }

      if (self.props.onRightClick)
      {
        // create a function seeded with the current key
        onRightClick = self.props.onRightClick(k);
      }

      return <DiffFeature key={k}
                          featureName={k}
                          onLeftClick={onLeftClick}
                          onRightClick={onRightClick} />
    });

    return (
      <div>
        {featureListItems}
      </div>
    );
  },

  _onDataChanged: function () {
    this.forceUpdate();
  },

});

module.exports = DiffFeatureList;
