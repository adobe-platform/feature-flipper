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
import Toggle from 'material-ui/lib/toggle'

const ApiClient = require('../ApiClient');
const Keys = require('../constants/Keys');

const LoginView = React.createClass({

  contextTypes: {
    router: React.PropTypes.object
  },

  getInitialState() {
    return {
      loginDialogOpen: !ApiClient.ready(),
      invokeUrl: localStorage.getItem(Keys.INVOKE_URL),
      apiKey: localStorage.getItem(Keys.API_KEY),
      rememberApiKey: Boolean(localStorage.getItem(Keys.API_KEY))
    }
  },

  componentWillMount() {
  },

  componentWillUnmount() {
  },

  _onInvokeUrlChange(e) {
    this.setState({
      invokeUrl: e.target.value
    })
  },

  _onApiKeyChange(e) {
    this.setState({
      apiKey: e.target.value
    })
  },

  _onLoginClose(e) {
    // TODO AuthStore with better logic for what it means to be logged in
    ApiClient.setEndpoint(this.state.invokeUrl);
    ApiClient.setAPIKey(this.state.apiKey);
    if (ApiClient.ready())
    {
      localStorage.setItem(Keys.INVOKE_URL, this.state.invokeUrl)
      if (this.refs.toggle.isToggled())
      {
        localStorage.setItem(Keys.API_KEY, this.state.apiKey)
      }
      this.context.router.push('/');
    }
  },

  _submitDisabled() {
    return !this.state.invokeUrl || !this.state.apiKey
  },

  _onToggle(e, toggleOn) {
    if (!toggleOn)
    {
      localStorage.removeItem(Keys.API_KEY)
    }
    this.setState({
      rememberApiKey: toggleOn
    })
  },

  render() {
    const loginActions = [
      <FlatButton
        label="Submit"
        primary={true}
        disabled={this._submitDisabled()}
        onTouchTap={this._onLoginClose}
      />,
    ];

    return (
      <Dialog
        title="Login"
        modal={true}
        open={true}
        actions={loginActions}
        onRequestClose={this._onLoginClose}
      >
        <TextField
          fullWidth={true}
          floatingLabelText="API Gateway Invoke URL (FeatureFlipper-private)"
          hintText="https://abcde12345.execute-api.us-west-2.amazonaws.com/prod"
          value={this.state.invokeUrl}
          onChange={this._onInvokeUrlChange} />

        <TextField
          fullWidth={true}
          floatingLabelText="API Gateway API Key"
          hintText="secret"
          value={this.state.apiKey}
          onChange={this._onApiKeyChange}
          type="password" />

        <Toggle
          ref="toggle"
          label="Remember API Key"
          labelPosition="right"
          style={{marginTop: 16}}
          toggled={this.state.rememberApiKey}
          onToggle={this._onToggle} />
      </Dialog>
    );
  }
});

module.exports = LoginView;
