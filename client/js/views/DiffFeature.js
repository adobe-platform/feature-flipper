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

const DiffFeature = React.createClass({

  propTypes: {
    featureName: React.PropTypes.string.isRequired,

    onRightClick: React.PropTypes.func,
    onLeftClick: React.PropTypes.func
  },

  getInitialState: function () {
    return {
      saving: false
    }
  },

  getDefaultProps: function () {
    return {
      featureName: ''
    };
  },

  render: function () {
    // console.log("DiffFeature render");

    // some of the strange <i> layout you see below is to prevent whitespace
    // from being collapsed around {featureName}
    var featureName = this.props.featureName;

    var iClassName = ['fa'];
    if (this.state.saving)
    {
      iClassName.push('fa-spinner', 'fa-spin', 'fa-fw');
    }
    else
    {
      iClassName.push('btn');
    }

    if (this.props.onLeftClick)
    {
      // compose function in a function that will modify local state
      var onLeftClick = this._onClick(this.props.onLeftClick);
    }

    if (this.props.onRightClick)
    {
      // compose function in a function that will modify local state
      var onRightClick = this._onClick(this.props.onRightClick);
    }

    if (this.props.onRightClick && this.props.onLeftClick)
    {
      var iClassNameL = iClassName.concat();
      var iClassNameR = iClassName.concat();

      if (!this.state.saving)
      {
        iClassNameR.push('fa-arrow-right');
        iClassNameL.push('fa-arrow-left');
      }

      return <p className="text-center">
               <i className={iClassNameL.join(' ')} onClick={onLeftClick}>
               </i> {featureName} <i className={iClassNameR.join(' ')} onClick={onRightClick} />
             </p>
    }
    else if (this.props.onLeftClick)
    {
      if (!this.state.saving) iClassName.push('fa-arrow-left');

      return <p className="text-left">
               <i className={iClassName.join(' ')} onClick={onLeftClick}>
             </i> {featureName}</p>
    }
    else if (this.props.onRightClick)
    {
      if (!this.state.saving) iClassName.push('fa-arrow-right');

      return <p className="text-right">
               {featureName} <i className={iClassName.join(' ')} onClick={onRightClick} />
             </p>
    }
  },

  _onClick: function (f) {
    var self = this;

    if (this.state.saving)
    {
      return
    }

    return function () {
      f();
      self.setState({
        saving: true
      });
    }
  },

});

module.exports = DiffFeature;
