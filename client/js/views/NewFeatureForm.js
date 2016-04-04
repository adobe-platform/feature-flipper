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
const FeatureDataStore = require('../stores/FeatureDataStore');
const SelectionStore = require('../stores/SelectionStore');
const ViewStore = require('../stores/ViewStore');

const NewFeatureForm = React.createClass({

  getInitialState() {
    return {
      open: false,
      inputValue: ''
    };
  },

  getDefaultProps() {
    return {
      // optional version of SelectionStore.FEATURE_RE
      textChangeRE: /^[A-Za-z]?(\w|\.)*$/
    };
  },

  componentWillMount() {
    FeatureDataStore.on(FeatureDataStore.SET_DATA_CHANGE_EVENT, this._onClose);
    ViewStore.on(ViewStore.NEW_FEATURE_EVENT, this._onOpen);
  },

  componentWillUnmount() {
    FeatureDataStore.removeListener(FeatureDataStore.SET_DATA_CHANGE_EVENT, this._onClose);
    ViewStore.removeListener(ViewStore.NEW_FEATURE_EVENT, this._onOpen);
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
    FFActions.createFeature(this.state.inputValue);
  },

  _onTextChange(e) {
    this.setState({
      inputValue: e.target.value
    });
  },

  render() {
    // console.log("NewFeatureForm render");

    let errorText = null;

    let submitEnabled = SelectionStore.FEATURE_RE.test(this.state.inputValue);

    const setData = FeatureDataStore.getCurrentSetData();
    if (setData && setData.get('features'))
    {
      const features = setData.get('features').map((k, v) => {
        return k;
      })

      if (!this.props.textChangeRE.test(this.state.inputValue))
      {
        errorText = "invalid feature name";
      }
      else if (this.state.inputValue.length > 30)
      {
        submitEnabled = false;
        errorText = "feature name too long";
      }
      else if (features.has(this.state.inputValue))
      {
        submitEnabled = false;
        errorText = this.state.inputValue + " already exists";
      }
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
        title={"New Feature for " + SelectionStore.getCurrentSet()}
        actions={actions}
        modal={false}
        open={this.state.open}
        onRequestClose={this._onClose}
      >
         <TextField
          hintText="feature"
          errorText={errorText}
          value={this.state.inputValue}
          onChange={this._onTextChange}/>
      </Dialog>

    );
  },

});

module.exports = NewFeatureForm;
