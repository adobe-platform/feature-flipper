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

import Popover from 'material-ui/lib/popover/popover'
import RaisedButton from 'material-ui/lib/raised-button'

const FFActions = require('../actions/FFActions');

const styles = {
  popover: {
    padding: 20,
  },
};

const AliasBtn = React.createClass({

  getInitialState() {
    return {
      open: false,
      anchorEl: null
    }
  },

  propTypes: {
    aliasName: React.PropTypes.string.isRequired
  },

  handleTouchTap(event) {
    this.setState({
      open: true,
      anchorEl: event.currentTarget,
    });
  },

  handleRequestClose() {
    this.setState({
      open: false,
    });
  },

  render() {
    return (
      <div className="ff-alias">
        <RaisedButton
          onTouchTap={this.handleTouchTap}
          label={this.props.aliasName}
          backgroundColor="#0CE8C4"
          labelStyle={{'text-transform': 'none'}}
        />
        <Popover
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
          targetOrigin={{horizontal: 'left', vertical: 'top'}}
          onRequestClose={this.handleRequestClose}
        >
          <div style={styles.popover}>
            <RaisedButton primary={true} label="Delete" onClick={this._onClick}/>
          </div>
        </Popover>
      </div>
    );
  },

  _onClick: function () {
    FFActions.deleteAlias(this.props.aliasName);
  }
})

module.exports = AliasBtn;
