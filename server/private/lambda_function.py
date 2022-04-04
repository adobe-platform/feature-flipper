# (c) 2016-2017 Adobe.  All rights reserved.
# This file is licensed to you under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License. You may obtain a copy
# of the License at http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under
# the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
# OF ANY KIND, either express or implied. See the License for the specific language
# governing permissions and limitations under the License.
from __future__ import print_function

import boto3
import botocore
import msgpack
import re
import traceback

print('Loading function')

dynamodb = boto3.client('dynamodb')

DB_DATA_TABLE = 'FeatureFlipper'
DB_ALIAS_TABLE = 'FeatureFlipperAliases'

VERSION = 1

DEFAULT_SET = {
    "version": VERSION,
    "features": {}
}


def lambda_handler(req, context):
    try:
        return handle_request(req)
    except HTTPError as e:
        traceback.print_exc()
        raise e
    except Exception as e:
        traceback.print_exc()
        s500()


def handle_request(req):

    if 'http_method' not in req:
        s400()

    if 'resource_path' not in req:
        s400()

    print('v2: ' + req['http_method'] + ' ' + req['resource_path'])
    if req['http_method'] == "GET":

        if req['resource_path'] == "/set/{set_id}":
            return get_set(req)
        if req['resource_path'] == "/set/{set_id}/aliases":
            return get_set_aliases(req)
        elif req['resource_path'] == "/sets":
            return get_sets(req)

    elif req['http_method'] == "PUT":

        if req['resource_path'] == "/set/{set_id}":
            return put_set(req)

    elif req['http_method'] == "DELETE":

        if req['resource_path'] == "/set/{set_id}":
            return delete_set(req)

        if req['resource_path'] == "/alias/{alias_id}":
            return delete_alias(req)

    elif req['http_method'] == "POST":

        if req['resource_path'] == "/set":
            return post_set(req)

        if req['resource_path'] == "/set/{set_id}/aliases":
            return post_alias(req)

    s404()


def get_sets(req):
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


def get_set(req):
    if 'set_id' not in req:
        s400()

    getItemRes = dynamodb.get_item(
        TableName=DB_DATA_TABLE,
        Key={
            'FeatureSet': {
                'S': req['set_id']
            }
        },
        ConsistentRead=True,
        ReturnConsumedCapacity='NONE'
    )

    if 'Item' in getItemRes:
        item = getItemRes['Item']
        if 'Data' in item and 'B' in item['Data']:
            res = msgpack.loads(item['Data']['B'])
            if 'ETag' in item and 'N' in item['ETag']:
                res['ETag'] = item['ETag']['N']
            return res
        else:
            return {}
    else:
        s404()


def put_set(req):
    if 'body' not in req:
        s400()

    if 'set_id' not in req:
        s400()

    if 'headers' not in req:
        s400()

    if 'if-match' not in req['headers']:
        s400()

    # feature data
    # {
    #   "version": 1,
    #   "features": {
    #     "any_key": {
    #       "description": "",
    #       "pctUsers": 0
    #     }
    #   }
    # }

    featureData = req['body']
    if 'features' not in featureData:
        s400()

    # strip keys that shouldn't be stored
    deleteKeys = []
    for k in featureData:
        if ['features'].count(k) == 0:
            deleteKeys.append(k)

    for k in deleteKeys:
        del featureData[k]

    featureData['version'] = VERSION

    try:
        newETag = str(int(req['headers']['if-match']) + 1)
        dynamodb.update_item(
            TableName=DB_DATA_TABLE,
            Key={
                'FeatureSet': {
                    'S': req['set_id']
                }
            },
            ReturnValues='NONE',
            ReturnConsumedCapacity='NONE',
            ReturnItemCollectionMetrics='NONE',
            UpdateExpression='SET #data=:data, #etag=:etag',
            ConditionExpression='#etag = :ifmatch',
            ExpressionAttributeNames={
                '#data': 'Data',
                '#etag': 'ETag'
            },
            ExpressionAttributeValues={
                ':data': {
                    'B': msgpack.dumps(featureData)
                },
                ':ifmatch': {
                    'N': req['headers']['if-match']
                },
                ':etag': {
                    'N': newETag
                }
            }
        )

        return {'ETag': newETag}

    # https://github.com/boto/botocore/blob/80cc4c39e6c4f24f85ef376569a59ca2e74fd9ea/botocore/exceptions.py#L325
    except botocore.exceptions.ClientError as e:
        if 'Error' in e.response and 'Code' in e.response['Error'] and e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            s409()
        else:
            raise e


def delete_set(req):
    if 'set_id' not in req:
        s400()

    if 'headers' not in req:
        s400()

    if 'if-match' not in req['headers']:
        s400()

    deleteItemRes = dynamodb.delete_item(
        TableName=DB_DATA_TABLE,
        Key={
            'FeatureSet': {
                'S': req['set_id']
            }
        },
        ReturnValues='ALL_OLD',
        ReturnConsumedCapacity='NONE',
        ReturnItemCollectionMetrics='NONE',
        ConditionExpression='#etag = :ifmatch',
        ExpressionAttributeNames={
            '#etag': 'ETag'
        },
        ExpressionAttributeValues={
            ':ifmatch': {
                'N': req['headers']['if-match']
            }
        }
    )

    if 'Attributes' not in deleteItemRes:
        s404()

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
        ConsistentRead=True
    )

    if 'Items' not in scanRes:
        return

    for item in scanRes['Items']:
        if 'Alias' in item and 'S' in item['Alias']:
            alias = item['Alias']['S']
            dynamodb.delete_item(
                TableName=DB_ALIAS_TABLE,
                Key={
                    'Alias': {
                        'S': alias
                    }
                },
                ReturnValues='NONE',
                ReturnConsumedCapacity='NONE',
                ReturnItemCollectionMetrics='NONE'
            )


def post_set(req):
    if 'body' not in req:
        s400()

    if 'channelSet' not in req['body']:
        s400()

    channelSet = req['body']['channelSet']
    # regex matches SelectionStore.CHANNEL_RE in front end
    if not re.match('^\w+\-[A-Za-z](\w|\-)*$', channelSet):
        s400()

    dataStr = msgpack.dumps(DEFAULT_SET)

    try:
        dynamodb.put_item(
            TableName=DB_DATA_TABLE,
            Item={
                'FeatureSet': {
                    'S': channelSet
                },
                'Data': {
                    'B': dataStr
                },
                'ETag': {
                    'N': '1'
                }
            },
            ConditionExpression='attribute_not_exists(FeatureSet)',
            ReturnValues='NONE',
            ReturnConsumedCapacity='NONE',
            ReturnItemCollectionMetrics='NONE'
        )
    except botocore.exceptions.ClientError as e:
        if 'Error' in e.response and 'Code' in e.response['Error'] and e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            s409()
        else:
            raise e


def post_alias(req):
    if 'set_id' not in req:
        s400()

    if 'body' not in req:
        s400()

    if 'alias_id' not in req['body']:
        s400()

    getItemRes = dynamodb.get_item(
        TableName=DB_DATA_TABLE,
        Key={
            'FeatureSet': {
                'S': req['set_id']
            }
        },
        ProjectionExpression='FeatureSet',
        ConsistentRead=True,
        ReturnConsumedCapacity='NONE'
    )

    if 'Item' not in getItemRes:
        s404()

    try:
        dynamodb.put_item(
            TableName=DB_ALIAS_TABLE,
            Item={
                'Alias': {
                    'S': req['body']['alias_id']
                },
                'FeatureSet': {
                    'S': req['set_id']
                }
            },
            ConditionExpression='attribute_not_exists(Alias)',
            ReturnValues='NONE',
            ReturnConsumedCapacity='NONE',
            ReturnItemCollectionMetrics='NONE'
        )
    except botocore.exceptions.ClientError as e:
        if 'Error' in e.response and 'Code' in e.response['Error'] and e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            s409()
        else:
            raise e


def delete_alias(req):
    if 'alias_id' not in req:
        s400()

    deleteItemRes = dynamodb.delete_item(
        TableName=DB_ALIAS_TABLE,
        Key={
            'Alias': {
                'S': req['alias_id']
            }
        },
        ReturnValues='ALL_OLD',
        ReturnConsumedCapacity='NONE',
        ReturnItemCollectionMetrics='NONE'
    )

    if 'Attributes' not in deleteItemRes:
        s404()


class HTTPError(Exception):
    def __init__(self, status_code):
        super(HTTPError, self).__init__(status_code)


def s400():
    raise HTTPError("400")


def s404():
    raise HTTPError("404")


def s409():
    raise HTTPError("409")


def s500():
    raise HTTPError("500")
