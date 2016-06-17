#  Copyright 2016 Adobe Systems Incorporated. All rights reserved.
#  This file is licensed to you under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License. You may obtain a copy
#  of the License at http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software distributed under
#  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
#  OF ANY KIND, either express or implied. See the License for the specific language
#  governing permissions and limitations under the License.
from __future__ import print_function

import boto3
import hashlib
import msgpack
import traceback

print('Loading function')

dynamodb = boto3.client('dynamodb')

DB_DATA_TABLE = 'FeatureFlipper'
DB_ALIAS_TABLE = 'FeatureFlipperAliases'


def lambda_handler(req, context):
    try:
        return handle_request(req)
    except HTTPError, e:
        traceback.print_exc()
        raise e
    except Exception, e:
        traceback.print_exc()
        s500()


def handle_request(req):

    if 'http_method' not in req:
        s400()

    if 'resource_path' not in req:
        s400()

    print(req['http_method'] + ' ' + req['resource_path'])
    if req['http_method'] == "GET":

        if req['resource_path'] == "/sets":
            return get_feature_sets(req)

        elif req['resource_path'] == "/set/{set_id}/features":
            if 'user_id' in req and req['user_id'] != "":
                return get_features_for_user(req)
            else:
                return get_features(req)

        elif req['resource_path'] == "/set/{set_id}/aliases":
            return get_set_aliases(req)

    s404()


def get_feature_sets(req):
    scanRes = dynamodb.scan(
        TableName=DB_DATA_TABLE,
        Select='SPECIFIC_ATTRIBUTES',
        ReturnConsumedCapacity='NONE',
        ProjectionExpression='FeatureSet',
        ConsistentRead=False
    )

    if 'Items' not in scanRes:
        s404()

    featureSets = []
    for item in scanRes['Items']:
        if 'FeatureSet' in item and 'S' in item['FeatureSet']:
            featureSets.append(item['FeatureSet']['S'])

    return {'featureSets': featureSets}


def get_set_aliases(req):
    if 'set_id' not in req:
        s400()

    scanRes = dynamodb.scan(
        TableName=DB_ALIAS_TABLE,
        Select='SPECIFIC_ATTRIBUTES',
        ReturnConsumedCapacity='NONE',
        ProjectionExpression='Alias',
        FilterExpression='#fs = :fs',
        ExpressionAttributeNames={
            '#fs': 'FeatureSet'
        },
        ExpressionAttributeValues={
            ':fs': {
                'S': req['set_id']
            }
        },
        ConsistentRead=False
    )

    if 'Items' not in scanRes:
        s404()

    aliases = []
    for item in scanRes['Items']:
        if 'Alias' in item and 'S' in item['Alias']:
            aliases.append(item['Alias']['S'])

    return {'aliases': aliases}


def get_features(req):
    if 'set_id' not in req:
        s400()

    setId = req['set_id']
    featureSetData = get_feature_set_data(setId)
    if featureSetData is None:
        s404()

    if 'features' not in featureSetData:
        return {'features': []}

    features = []

    for featureName in featureSetData['features']:
        featureData = featureSetData['features'][featureName]

        if 'pctUsers' not in featureData:
            continue

        if featureData['pctUsers'] != 1:
            continue

        features.append(featureName)

    return {'features': features}


def get_features_for_user(req):
    if 'set_id' not in req:
        s400()

    if 'user_id' not in req:
        s400()

    featureSetData = get_feature_set_data(req['set_id'])
    if featureSetData is None:
        s404()

    if 'features' not in featureSetData:
        return {'features': []}

    shard = int(hashlib.md5(req['user_id']).hexdigest(), 16) % 100
    features = []

    for featureName in featureSetData['features']:
        featureData = featureSetData['features'][featureName]

        if 'pctUsers' not in featureData:
            continue

        actualPercent = int(featureData['pctUsers'] * 100)
        # shard   range is [0,100)
        # percent range is [0,100]
        #
        # the user in shard 99 should see all features if actualPercent == 100
        # and SHOULD NOT see the feature rolled out to 99% of users
        if shard < actualPercent:
            features.append(featureName)

    return {'features': features}


def get_feature_set_data(setId):

    getAliasRes = dynamodb.get_item(
        TableName=DB_ALIAS_TABLE,
        Key={
            'Alias': {
                'S': setId
            }
        },
        ConsistentRead=False,
        ReturnConsumedCapacity='NONE'
    )

    if 'Item' in getAliasRes:
        if 'FeatureSet' in getAliasRes['Item']:
            if 'S' in getAliasRes['Item']['FeatureSet']:
                setId = getAliasRes['Item']['FeatureSet']['S']

    getDataRes = dynamodb.get_item(
        TableName=DB_DATA_TABLE,
        Key={
            'FeatureSet': {
                'S': setId
            }
        },
        ConsistentRead=False,
        ReturnConsumedCapacity='NONE'
    )

    if 'Item' in getDataRes:
        item = getDataRes['Item']
        if 'Data' in item and 'B' in item['Data']:
            featureData = msgpack.loads(item['Data']['B'])
            print(featureData)
            return featureData
        else:
            return {}
    else:
        return None


class HTTPError(Exception):
    def __init__(self, status_code):
        super(HTTPError, self).__init__(status_code)


def s400():
    raise HTTPError("400")


def s404():
    raise HTTPError("404")


def s500():
    raise HTTPError("500")
