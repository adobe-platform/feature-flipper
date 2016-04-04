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
import immutableRenderMixin from 'react-immutable-render-mixin'

import IconMenu from 'material-ui/lib/menus/icon-menu'
import IconButton from 'material-ui/lib/icon-button'
import FontIcon from 'material-ui/lib/font-icon'
import MenuItem from 'material-ui/lib/menus/menu-item'
import Toolbar from 'material-ui/lib/toolbar/toolbar'
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group'
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title'

const FFActions = require('../actions/FFActions');
const FeatureDataStore = require('../stores/FeatureDataStore');
const SelectionStore = require('../stores/SelectionStore');
const AppDispatcher = require('../dispatcher/AppDispatcher');
const ActionTypes = require('../constants/ActionTypes');

const ChannelDropDown = require('./ChannelDropDown');
const DiffSetView = require('./DiffSetView');
const FeatureSetView = require('./FeatureSetView');
const NewSetForm = require('./NewSetForm');
const DeleteDialog = require('./DeleteDialog');
const NewChannelForm = require('./NewChannelForm');
const NewFeatureForm = require('./NewFeatureForm');
const NewAliasForm = require('./NewAliasForm');
const SetDropDown = require('./SetDropDown');

const FeatureDataEditor = React.createClass({
  mixins: [ immutableRenderMixin ],

  getInitialState() {
    return {
      setData: Immutable.Map()
    };
  },

  componentWillMount() {
    FeatureDataStore.on(FeatureDataStore.SET_DATA_CHANGE_EVENT, this._onDataChanged);
  },

  componentWillUnmount() {
    FeatureDataStore.removeListener(FeatureDataStore.SET_DATA_CHANGE_EVENT, this._onDataChanged);
  },

  _onDeleteFeatureSet() {
    let prompt = 'Are you sure you want to delete ';
    prompt += SelectionStore.getCurrentSet().toUpperCase();
    prompt += ' in ';
    prompt += SelectionStore.getCurrentChannel().toUpperCase() + '?';
    AppDispatcher.dispatch({
      actionType: ActionTypes.DELETE_SOMETHING_PROMPT,
      payload: {
        confirmFunc: FFActions.deleteFeatureSet,
        prompt: prompt
      }
    });
  },

  _onNewChannel() {
    FFActions.newChannel()
  },

  _onNewFeatureSet() {
    FFActions.newSet()
  },

  _onNewFeature() {
    FFActions.newFeature()
  },

  _onNewAlias() {
    FFActions.newAlias()
  },

  _onDataChanged() {
    this.setState({
      setData: FeatureDataStore.getCurrentSetData()
    });
  },

  render() {
    // console.log("FeatureDataEditor render");

    return (
      <div>

        <Toolbar style={{'backgroundColor': '#009EB2'}}>

          <ToolbarGroup firstChild={true} float="left">
            <ToolbarTitle text="Feature sets" style={{'padding-left': '10px'}}/>

            <ChannelDropDown />

            <SetDropDown />
          </ToolbarGroup>

          <ToolbarGroup float="right">

            <IconMenu
              iconButtonElement={<IconButton ><FontIcon className="mi-add-box"/></IconButton>}
              anchorOrigin={{horizontal: 'right', vertical: 'top'}}
              targetOrigin={{horizontal: 'right', vertical: 'top'}}
              iconStyle={{'color': 'white', 'font-size': '32px'}}
            >
              <MenuItem
                primaryText="New Channel"
                onTouchTap={this._onNewChannel}
              />
              <MenuItem
                primaryText="New Feature Set"
                onTouchTap={this._onNewFeatureSet}
                disabled={!Boolean(SelectionStore.getCurrentChannel())}
              />
              <MenuItem
                primaryText="New Feature"
                onTouchTap={this._onNewFeature}
                disabled={!Boolean(SelectionStore.getCurrentSet())}
              />
              <MenuItem
                primaryText="New Alias"
                onTouchTap={this._onNewAlias}
                disabled={!Boolean(SelectionStore.getCurrentChannel())}
              />
            </IconMenu>

            <IconMenu
              iconButtonElement={<IconButton ><FontIcon className="mi-more-vert"/></IconButton>}
              anchorOrigin={{horizontal: 'right', vertical: 'top'}}
              targetOrigin={{horizontal: 'right', vertical: 'top'}}
              iconStyle={{'color': 'white', 'font-size': '32px'}}
            >
              <MenuItem
                leftIcon={<FontIcon className="mi-content-copy"/>}
                primaryText="Copy feature set"
                disabled={true}
              />
              <MenuItem
                leftIcon={<FontIcon className="mi-delete-forever"/>}
                primaryText="Delete feature set"
                onTouchTap={this._onDeleteFeatureSet}
              />
            </IconMenu>
          </ToolbarGroup>
        </Toolbar>

        <NewSetForm />

        <NewChannelForm />

        <NewFeatureForm />

        <NewAliasForm />

        <DeleteDialog />

        <FeatureSetView featureSetData={this.state.setData} />

      </div>
    );
  }
});

module.exports = FeatureDataEditor;
