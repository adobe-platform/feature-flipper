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
import immutableRenderMixin from 'react-immutable-render-mixin'

import FlatButton from 'material-ui/lib/flat-button'
import FontIcon from 'material-ui/lib/font-icon'
import Paper from 'material-ui/lib/paper'
import Slider from 'material-ui/lib/slider'
import TextField from 'material-ui/lib/text-field'

const FFActions = require('../actions/FFActions');
const FeatureDataStore = require('../stores/FeatureDataStore');

const FeatureView = React.createClass({
  mixins: [ immutableRenderMixin ],

  propTypes: {
    featureName: React.PropTypes.string.isRequired,
    featureData: React.PropTypes.object.isRequired
  },

  getDefaultProps() {
    return {
      featureName: '',
      featureData: 0
    }
  },

  getInitialState() {
    return {
      featureDescription: '',
      featurePctUsers: 0
    };
  },

  componentWillReceiveProps(newprops) {
    this.setState({
      featureDescription: newprops.featureData.get('description'),
      featurePctUsers: newprops.featureData.get('pctUsers')
    });
  },

  componentWillMount() {
    this.setState({
      featureDescription: this.props.featureData.get('description'),
      featurePctUsers: this.props.featureData.get('pctUsers')
    });
  },

  _canSave() {
    let propDescription = this.props.featureData.get('description');
    let propPctUsers = this.props.featureData.get('pctUsers');
    let stateDescription = this.state.featureDescription;
    let statePctUsers = this.state.featurePctUsers;

    return propDescription != stateDescription || propPctUsers != statePctUsers;
  },

  _onSaveChanges(event) {
    let featureData = this.props.featureData;
    featureData = featureData.set('description', this.state.featureDescription);
    featureData = featureData.set('pctUsers', Number(this.state.featurePctUsers));

    FFActions.saveFeatureChange(this.props.featureName, featureData);
  },

  _onDescriptionChange(e) {
    this.setState({
      featureDescription: e.target.value
    });
  },

  _onPctUsersChange(e, newValue) {
    this.setState({
      featurePctUsers: newValue
    });
  },

  render() {
    // console.log("FeatureView render", this.props.featureName);

    return (
      <Paper className="ff-feature">

        <p className="ff-feature-name">{this.props.featureName}</p>

        <TextField
          floatingLabelText="Description"
          hintText="a helpful description"
          inputStyle={{'font-size': '12px'}}
          hintStyle={{'font-size': '12px'}}
          fullWidth={true}
          value={this.state.featureDescription}
          onChange={this._onDescriptionChange} />

        <p className="ff-pct-user-desc">{Math.ceil(this.state.featurePctUsers * 100) + '% of users see this feature'}</p>
        <Slider
          onChange={this._onPctUsersChange}
          value={this.state.featurePctUsers} />

        <FlatButton
          label="Save"
          disabled={!this._canSave()}
          primary={true}
          linkButton={true}
          onClick={this._onSaveChanges}
          icon={<FontIcon className="mi-save" />}
        />

        <FlatButton
          label="Delete"
          linkButton={true}
          style={{'float': 'right'}}
          onClick={() => FFActions.deleteFeature(this.props.featureName)}
          icon={<FontIcon className="mi-delete-forever" />}
        />

      </Paper>

    );
  },

});

module.exports = FeatureView;
