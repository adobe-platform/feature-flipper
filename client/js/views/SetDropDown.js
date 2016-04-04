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

import MenuItem from 'material-ui/lib/menus/menu-item'
import SelectField from 'material-ui/lib/SelectField'

const FFActions = require('../actions/FFActions');
const SelectionStore = require('../stores/SelectionStore');

const SetDropDown = React.createClass({

  getInitialState: function () {
    return {
      sets: []
    };
  },

  componentWillMount: function () {
    SelectionStore.on(SelectionStore.SET_CHANGE_EVENT, this._onDataChanged);
  },

  componentWillUnmount: function() {
    SelectionStore.removeListener(SelectionStore.SET_CHANGE_EVENT, this._onDataChanged);
  },

  render: function () {
    // console.log("SetDropDown render");

    const labelStyle = {
      'color': '#ffffff'
    }

    return (
      <SelectField value={this.state.currentSet}
                   labelStyle={labelStyle}
                   onChange={this._onSelectionChange}>
        {this.state.sets}
      </SelectField>
    );
  },

  _onDataChanged: function () {
    const sets = SelectionStore.getFeatureSets();

    const optionTags = sets.map(function (set) {
      return <MenuItem key={set} value={set} primaryText={set} />
    })

    this.setState({
      sets: optionTags,
      currentSet: SelectionStore.getCurrentSet()
    });
  },

  _onSelectionChange: function (e, k, payload) {
    FFActions.selectSet(payload);
  }
});

module.exports = SetDropDown;
