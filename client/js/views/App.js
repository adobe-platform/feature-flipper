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
import AppBar from 'material-ui/lib/app-bar'

import Colors from 'material-ui/lib/styles/colors'
import getMuiTheme from 'material-ui/lib/styles/getMuiTheme'
import themeDecorator from 'material-ui/lib/styles/theme-decorator'

import Dialog from 'material-ui/lib/dialog'
import LeftNav from 'material-ui/lib/left-nav'
import MenuItem from 'material-ui/lib/menus/menu-item'
import Snackbar from 'material-ui/lib/snackbar'

const ApiClient = require('../ApiClient');
const FeatureDataStore = require('../stores/FeatureDataStore');
const AliasStore = require('../stores/AliasStore');
const SelectionStore = require('../stores/SelectionStore');

const muiTheme = getMuiTheme({
  accent1Color: Colors.deepOrange500,
});

const App = React.createClass({

  getInitialState() {
    return {}
  },

  componentWillMount() {
    FeatureDataStore.on(FeatureDataStore.NOTIFICATION_EVENT, this._onNotification);
    SelectionStore.on(SelectionStore.NOTIFICATION_EVENT, this._onNotification);
    AliasStore.on(AliasStore.NOTIFICATION_EVENT, this._onNotification);
  },

  componentWillUnmount() {
    FeatureDataStore.removeListener(FeatureDataStore.NOTIFICATION_EVENT, this._onNotification);
    SelectionStore.removeListener(SelectionStore.NOTIFICATION_EVENT, this._onNotification);
    AliasStore.removeListener(AliasStore.NOTIFICATION_EVENT, this._onNotification);
  },

  _onNotification(notificationMsg) {
    this.setState({
      snackBarOpen: true,
      notificationMsg: notificationMsg
    });
  },

  _onHelpOpen() {
    this.setState({
      helpDialogOpen: true
    })
  },

  _onHelpClose() {
    this.setState({
      helpDialogOpen: false
    })
  },

  _onNavClose() {
    this.setState({
      navOpen: false
    })
  },

  _onDiffSets() {
    this._onNavClose();
    // TODO history.pushState and add DiffSet to Routes
  },

  _onLeftIconButtonTouchTap() {
    if (ApiClient.ready())
    {
      this.setState({navOpen: !this.state.navOpen});
    }
  },

  render() {
    return (
      <div>
        <AppBar
          title="Feature Flipper"
          iconClassNameRight="mi-help-outline"
          onRightIconButtonTouchTap={this._onHelpOpen}
          onLeftIconButtonTouchTap={this._onLeftIconButtonTouchTap}
        />

        {this.props.children}

        <LeftNav
          docked={false}
          width={200}
          open={this.state.navOpen}
          onRequestChange={open => this.setState({navOpen: open})}
        >
          <MenuItem onTouchTap={this._onDiffSets} disabled={true}>Diff Sets</MenuItem>
        </LeftNav>

        <Dialog
          title="Feature Flipper Help"
          modal={false}
          open={this.state.helpDialogOpen}
          onRequestClose={this._onHelpClose}
        >
          <p>A channel is an {'{environment}-{service}'} tuple (e.g.PROD-BlogService)</p>

          <p>A channel has feature sets.</p>

          <p>Feature sets have features.</p>

          <p>Features have a description and percentage of users that can see them.</p>

          <p>Aliases are another way to reference a feature set. Treat them like public links that you share out to stakeholders.</p>
        </Dialog>

        <Snackbar
          open={this.state.snackBarOpen}
          message={this.state.notificationMsg}
          autoHideDuration={4000}
          onRequestClose={() => this.setState({snackBarOpen: false})}
        />
      </div>
    );
  }
});

module.exports = themeDecorator(muiTheme)(App);
