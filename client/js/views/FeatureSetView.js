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

import Paper from 'material-ui/lib/paper'

const FFActions = require('../actions/FFActions');

const FeatureView = require('./FeatureView');
const NewFeatureForm = require('./NewFeatureForm');
const AliasesView = require('./AliasesView');

const FeatureSetView = React.createClass({
  mixins: [ immutableRenderMixin ],

  propTypes: {
    featureSetData: React.PropTypes.object.isRequired
  },

  render() {
    // console.log("FeatureSetView render");

    var featureSetData = this.props.featureSetData;
    var featureViews = [];
    var features = featureSetData.get('features');
    if (features)
    {
      features.map((v, k) => {
        let view = <FeatureView key={k}
                                featureName={k}
                                featureData={v}/>
        featureViews.push(view);
      })
    }

    return (
      <div>
        <AliasesView />

        <Paper zDepth={2} className="ff-paper">
          <h3 className="ff-paper-title">Features</h3>

          {featureViews}
        </Paper>
      </div>
    );
  }

});

module.exports = FeatureSetView;
