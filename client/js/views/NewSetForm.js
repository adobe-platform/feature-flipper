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
import TextField from 'material-ui/lib/text-field'

const FFActions = require('../actions/FFActions');
const SelectionStore = require('../stores/SelectionStore');
const FeatureDataStore = require('../stores/FeatureDataStore');
const ViewStore = require('../stores/ViewStore');

const NewSetForm = React.createClass({

  getInitialState() {
    return {
      open: false,
      inputValue: ''
    };
  },

  getDefaultProps() {
    return {
      // optional version of SelectionStore.SET_RE
      textChangeRE: /^[A-Za-z]?(\w|\.)*$/
    };
  },

  componentWillMount() {
    SelectionStore.on(SelectionStore.SET_CHANGE_EVENT, this._onClose);
    ViewStore.on(ViewStore.NEW_SET_EVENT, this._onOpen);
  },

  componentWillUnmount() {
    SelectionStore.removeListener(SelectionStore.SET_CHANGE_EVENT, this._onClose);
    ViewStore.removeListener(ViewStore.NEW_SET_EVENT, this._onOpen);
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
    FFActions.createFeatureSet(this.state.inputValue);
  },

  _onTextChange(e) {
    this.setState({
      inputValue: e.target.value
    });
  },

  render() {
    // console.log("NewSetForm render");

    let errorText = null;

    let submitEnabled = SelectionStore.SET_RE.test(this.state.inputValue);

    const sets = SelectionStore.getFeatureSets();
    if (!this.props.textChangeRE.test(this.state.inputValue))
    {
      errorText = "invalid set name";
    }
    else if (sets.indexOf(this.state.inputValue) != -1)
    {
      submitEnabled = false;
      errorText = "this conflicts with another feature set";
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
        title={"New Feature Set in " + SelectionStore.getCurrentChannel()}
        actions={actions}
        modal={false}
        open={this.state.open}
        onRequestClose={this._onClose}
      >
         <TextField
          hintText="feature_set"
          errorText={errorText}
          value={this.state.inputValue}
          onChange={this._onTextChange}/>
      </Dialog>

    );
  },

});

module.exports = NewSetForm;
