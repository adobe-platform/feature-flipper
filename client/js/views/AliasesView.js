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

import Paper from 'material-ui/lib/paper'

const AliasStore = require('../stores/AliasStore');
const AliasBtn = require('./AliasBtn');

const AliasesView = React.createClass({

  getInitialState() {
    return {
      aliases: Immutable.List()
    };
  },

  componentWillMount() {
    AliasStore.on(AliasStore.ALIAS_CHANGE_EVENT, this._onDataChanged);
  },

  componentWillUnmount() {
    AliasStore.removeListener(AliasStore.ALIAS_CHANGE_EVENT, this._onDataChanged);
  },

  _onDataChanged() {
    this.setState({
      aliases: AliasStore.getAliases()
    });
  },

  render() {
    // console.log("AliasesView render");

    var aliasViews = [];
    this.state.aliases.map((v) => {
      let view = <AliasBtn key={v}
                           aliasName={v} />
      aliasViews.push(view);
    })

    return (
      <Paper zDepth={2} className="ff-paper">
        <h3 className="ff-paper-title">Aliases</h3>

        {aliasViews}
      </Paper>
    );
  }

});

module.exports = AliasesView;
