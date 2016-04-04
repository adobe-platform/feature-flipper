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

import Dialog from 'material-ui/lib/dialog'
import FlatButton from 'material-ui/lib/flat-button'

const ViewStore = require('../stores/ViewStore');
const AppDispatcher = require('../dispatcher/AppDispatcher');
const ActionTypes = require('../constants/ActionTypes');

const DeleteDialog = React.createClass({

  getInitialState() {
    return {
      open: false
    };
  },

  componentWillMount() {
    ViewStore.on(ViewStore.DELETE_SOMETHING, this._onOpen);
  },

  componentWillUnmount() {
    ViewStore.removeListener(ViewStore.DELETE_SOMETHING, this._onOpen);
  },

  _onOpen(prompt) {
    this.setState({
      open: true,
      prompt: prompt
    })
  },

  _onCancel() {
    AppDispatcher.dispatch({
      actionType: ActionTypes.DELETE_SOMETHING_CANCEL
    });
    this.setState(this.getInitialState());
  },

  _onConfirm() {
    AppDispatcher.dispatch({
      actionType: ActionTypes.DELETE_SOMETHING_CONFIRM
    });
    this.setState(this.getInitialState());
  },

  render() {
    // console.log("DeleteDialog render");

    const actions = [
      <FlatButton
        label="DELETE"
        primary={true}
        onTouchTap={this._onConfirm}
      />,
    ];

    return (

      <Dialog
        title="Delete confirmation"
        actions={actions}
        modal={false}
        open={this.state.open}
        onRequestClose={this._onCancel}
      >
        {this.state.prompt}
      </Dialog>

    );
  },

});

module.exports = DeleteDialog;
