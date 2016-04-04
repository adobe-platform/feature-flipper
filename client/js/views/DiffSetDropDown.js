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

const FFActions = require('../actions/FFActions');
const FeatureDataStore = require('../stores/FeatureDataStore');

const DiffSetDropDown = React.createClass({

  propTypes: {
    getFeatureSets: React.PropTypes.func.isRequired,
    getCurrentSet: React.PropTypes.func.isRequired,
    setCurrentSet: React.PropTypes.func.isRequired,

    setChangeEvent: React.PropTypes.string.isRequired
  },

  getInitialState: function () {
    return {
      sets: Immutable.List()
    };
  },

  componentWillMount: function () {
    FeatureDataStore.on(this.props.setChangeEvent, this._onDataChanged);
  },

  componentDidMount: function () {
    this._onDataChanged();
  },

  componentWillUnmount: function () {
    FeatureDataStore.removeListener(this.props.setChangeEvent, this._onDataChanged);
  },

  render: function () {
    // console.log("DiffSetDropDown render");

    var divClassName = [this.props.className, 'form-inline'];
    return (
      <div className={divClassName.join(' ')}>
        <select className="form-control"
                value={this.state.currentSet}
                onChange={this._onSelectionChange}>
          {this.state.sets}
        </select>
      </div>
    );
  },

  _onDataChanged: function () {
    var sets = this.props.getFeatureSets();

    var optionTags = sets.map(function (set) {
      return <option key={set}>{set}</option>;
    })

    this.setState({
      sets: optionTags,
      currentSet: this.props.getCurrentSet()
    });
  },

  _onSelectionChange: function (e) {
    var newSelection = e.target.value;
    this.props.setCurrentSet(newSelection);
    this.setState({
      currentSet: this.props.getCurrentSet()
    })
  }
});

module.exports = DiffSetDropDown;
