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
import async from 'async'

var FLIPPER_ENDPOINT = null;
var FLIPPER_API_KEY = null;
var setToETag = {};

const ApiClient = {};

const updateETag = (set_id, data, status, xhr) => {
  // artifact of API Gateway. see TODO in deploy.py
  if (data && 'ETag' in data)
  {
    delete data['ETag']
  }
  setToETag[set_id] = xhr.getResponseHeader('ETag');
}

const addAuth = (settings) => {
  if (!FLIPPER_API_KEY)
  {
    return
  }

  if (!settings.headers)
  {
    settings.headers = {}
  }

  settings.headers['x-api-key'] = FLIPPER_API_KEY
}

ApiClient.setEndpoint = (value) => {
  FLIPPER_ENDPOINT = value;
}

ApiClient.setAPIKey = (value) => {
  FLIPPER_API_KEY = value;
}

ApiClient.ready = () => {
  return Boolean(FLIPPER_ENDPOINT);
}

ApiClient.getFeatureSets = () => {
  const settings = {
    'headers': {
      'accept': 'application/json'
    }
  };
  addAuth(settings);

  const promise = $.ajax(FLIPPER_ENDPOINT + '/sets', settings);

  return promise;
}

ApiClient.getFeatureSet = (set_id) => {
  const settings = {
    'headers': {
      'accept': 'application/json'
    }
  };
  addAuth(settings);

  const promise = $.ajax(FLIPPER_ENDPOINT + '/set/' + set_id, settings)
  promise.success(async.apply(updateETag, set_id));

  return promise;
}

ApiClient.postFeatureSet = (channelSet) => {
  const settings = {
    'headers': {
      'content-type': 'application/json'
    },
    'method': 'POST',
    'data': JSON.stringify({
      'channelSet': channelSet
    })
  };
  addAuth(settings);

  const promise = $.ajax(FLIPPER_ENDPOINT + '/set', settings);

  return promise;
}

ApiClient.deleteFeatureSet = (set_id) => {
  const settings = {
    'headers': {
      'accept': 'application/json',
      'if-match': setToETag[set_id]
    },
    'method': 'DELETE'
  };
  addAuth(settings);

  const promise = $.ajax(FLIPPER_ENDPOINT + '/set/' + set_id, settings);

  return promise;
}

ApiClient.putFeatureSet = (set_id, featureSetData) => {
  const settings = {
    'headers': {
      'content-type': 'application/json',
      'if-match': setToETag[set_id]
    },
    'method': 'PUT',
    'data': JSON.stringify(featureSetData)
  };
  addAuth(settings);

  const promise = $.ajax(FLIPPER_ENDPOINT + '/set/' + set_id, settings);
  promise.success(async.apply(updateETag, set_id));

  return promise;
}

ApiClient.getAliases = (set_id) => {
  const settings = {
    'headers': {
      'accept': 'application/json'
    },
    'method': 'GET'
  };
  addAuth(settings);

  const promise = $.ajax(FLIPPER_ENDPOINT + '/set/' + set_id + '/aliases', settings);

  return promise;
}

ApiClient.postAlias = (set_id, alias_id) => {
  const settings = {
    'headers': {
      'content-type': 'application/json'
    },
    'method': 'POST',
    'data': JSON.stringify({
      alias_id: alias_id
    })
  };
  addAuth(settings);

  const promise = $.ajax(FLIPPER_ENDPOINT + '/set/' + set_id + '/aliases', settings);

  return promise;
}

ApiClient.deleteAlias = (alias_id) => {
  const settings = {
    'headers': {
      // not true but API Gateway deployment would be complicated by telling
      // the truth
      'content-type': 'application/json'
    },
    'method': 'DELETE'
  };
  addAuth(settings);

  const promise = $.ajax(FLIPPER_ENDPOINT + '/alias/' + alias_id, settings);

  return promise;
}

module.exports = ApiClient;
