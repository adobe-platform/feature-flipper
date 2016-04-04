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
import { render } from 'react-dom'
import { Router, Route, IndexRoute, hashHistory } from 'react-router'

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

const ApiClient = require('./ApiClient')
const App = require('./views/App');
  const Login = require('./views/LoginView');
  const FeatureDataEditor = require('./views/FeatureDataEditor');

const routes = (
  <Router history={hashHistory}>
    <Route path="/" component={App} onEnter={onEnter}>

      <IndexRoute component={FeatureDataEditor}/>

      <Route path="/login" component={Login}/>

    </Route>
  </Router>
)

function onEnter(nextState, replace) {
  if (nextState.location.pathname != '/login' && !ApiClient.ready())
  {
    replace(null, '/login');
  }
}

render(routes, document.getElementById('react_app'))
