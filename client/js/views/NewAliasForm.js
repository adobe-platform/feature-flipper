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

import Dialog from 'material-ui/lib/dialog'
import FlatButton from 'material-ui/lib/flat-button'
import TextField from 'material-ui/lib/text-field'

const FFActions = require('../actions/FFActions');
const AliasStore = require('../stores/AliasStore');
const SelectionStore = require('../stores/SelectionStore');
const ViewStore = require('../stores/ViewStore');

const textChangeRE = /^\w*$/;
const validationRE = /^\w+$/;

const NewAliasForm = React.createClass({

  getInitialState() {
    return {
      open: false,
      inputValue: ''
    };
  },

  componentWillMount() {
    AliasStore.on(AliasStore.ALIAS_CHANGE_EVENT, this._onClose);
    ViewStore.on(ViewStore.NEW_ALIAS_EVENT, this._onOpen);
  },

  componentWillUnmount() {
    AliasStore.removeListener(AliasStore.ALIAS_CHANGE_EVENT, this._onClose);
    ViewStore.removeListener(ViewStore.NEW_ALIAS_EVENT, this._onOpen);
  },

  _onOpen() {
    this.setState({
      open: true
    })
  },

  _onClose() {
    this.setState(this.getInitialState())
  },

  _onSubmit() {
    FFActions.createAlias(this.state.inputValue);
  },

  _onTextChange(e) {
    this.setState({
      inputValue: e.target.value
    });
  },

  render() {
    // console.log("NewAliasForm render");

    let errorText = null;

    let submitEnabled = validationRE.test(this.state.inputValue);

    const aliases = AliasStore.getAliases();
    if (!textChangeRE.test(this.state.inputValue))
    {
      errorText = "invalid alias";
    }
    else if (aliases.includes(this.state.inputValue))
    {
      submitEnabled = false;
      errorText = this.state.inputValue + " already exists";
    }

    const actions = [
      <FlatButton
        label="Submit"
        primary={true}
        disabled={!submitEnabled}
        onTouchTap={this._onSubmit}
      />,
    ];

    return (

      <Dialog
        title={"New Alias for " + SelectionStore.getCurrentChannel()}
        actions={actions}
        modal={false}
        open={this.state.open}
        onRequestClose={this._onClose}
      >
         <TextField
          hintText="alias"
          errorText={errorText}
          value={this.state.inputValue}
          onChange={this._onTextChange}/>
      </Dialog>

    );
  },

});

module.exports = NewAliasForm;
