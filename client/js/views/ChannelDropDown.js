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

const ChannelDropDown = React.createClass({

  getInitialState: function () {
    return {
      channels: []
    };
  },

  componentWillMount: function () {
    SelectionStore.on(SelectionStore.CHANNEL_CHANGE_EVENT, this._onDataChanged);
    FFActions.fetchChannels();
  },

  componentWillUnmount: function() {
    SelectionStore.removeListener(SelectionStore.CHANNEL_CHANGE_EVENT, this._onDataChanged);
  },

  render: function () {
    // console.log("ChannelDropDown render");

    const labelStyle = {
      'color': '#ffffff'
    }

    return (
      <SelectField value={this.state.currentChannel}
                   labelStyle={labelStyle}
                   onChange={this._onSelectionChange}>
        {this.state.channels}
      </SelectField>
    );
  },

  _onDataChanged: function () {
    const channels = SelectionStore.getChannelNames();

    const optionTags = channels.map(function (set) {
      return <MenuItem key={set} value={set} primaryText={set} />
    })

    this.setState({
      channels: optionTags,
      currentChannel: SelectionStore.getCurrentChannel()
    });
  },

  _onSelectionChange: function (e, key, payload) {
    FFActions.selectChannel(payload);
  }
});

module.exports = ChannelDropDown;
