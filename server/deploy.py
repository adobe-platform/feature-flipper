# (c) 2016-2017 Adobe.  All rights reserved.
# This file is licensed to you under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License. You may obtain a copy
# of the License at http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under
# the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
# OF ANY KIND, either express or implied. See the License for the specific language
# governing permissions and limitations under the License.
import boto3
import json

dynamodb = boto3.client('dynamodb')
iam = boto3.client('iam')
s3 = boto3.client('s3')

# https://forums.aws.amazon.com/thread.jspa?threadID=116724
# http://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
S3_HOSTED_ZONES = {
    'us-east-2': 'Z2O1EMRO9K5GLX',
    'us-east-1': 'Z3AQBSTGFYJSTF',
    'us-west-1': 'Z2F56UZL2M1ACD',
    'us-west-2': 'Z3BJ6K6RIION7M',
    'ca-central-1': 'Z1QDHH18159H29',
    'ap-south-1': 'Z11RGJOFQNVJUP',
    'ap-northeast-2': 'Z3W03O7B5YMIYP',
    'ap-southeast-1': 'Z3O0J2DXBE1FTB',
    'ap-southeast-2': 'Z1WCIGYICN2BYD',
    'ap-northeast-1': 'Z2M4EHUR26P7ZW',
    'eu-central-1': 'Z21DNDUVLTQW6Q',
    'eu-west-1': 'Z1BKCTXD74EZPE',
    'eu-west-2': 'Z3GKZC51ZF0DB4',
    'sa-east-1': 'Z7KQH4QJS55SO',
}


def deploy():
    ensure_tables()
    ensure_lambda_role()
    ensure_s3_bucket()


def ensure_tables():
    try:
        dynamodb.describe_table(TableName='FeatureFlipper')
        print('FeatureFlipper DynamoDB table exists')
    except dynamodb.exceptions.ResourceNotFoundException:
        print('Creating FeatureFlipper DynamoDB table')
        dynamodb.create_table(
            TableName='FeatureFlipper',
            AttributeDefinitions=[
                {
                    'AttributeName': 'FeatureSet',
                    'AttributeType': 'S'
                },
            ],
            KeySchema=[
                {
                    'AttributeName': 'FeatureSet',
                    'KeyType': 'HASH'
                },
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 1
            },
        )

    try:
        dynamodb.describe_table(TableName='FeatureFlipperAliases')
        print('FeatureFlipperAliases DynamoDB table exists')
    except dynamodb.exceptions.ResourceNotFoundException:
        print('Creating FeatureFlipperAliases DynamoDB table')
        dynamodb.create_table(
            TableName='FeatureFlipperAliases',
            AttributeDefinitions=[
                {
                    'AttributeName': 'Alias',
                    'AttributeType': 'S'
                },
            ],
            KeySchema=[
                {
                    'AttributeName': 'Alias',
                    'KeyType': 'HASH'
                },
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 1
            },
        )


def ensure_lambda_role():
    try:
        iam.get_role(RoleName='lambda_feature_flipper')
        print('lambda_feature_flipper IAM role exists')
    except iam.exceptions.NoSuchEntityException:
        print('Creating IAM role lambda_feature_flipper')
        iam.create_role(
            RoleName='lambda_feature_flipper',
            AssumeRolePolicyDocument='''{
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Sid": "",
                  "Effect": "Allow",
                  "Principal": {
                    "Service": "lambda.amazonaws.com"
                  },
                  "Action": "sts:AssumeRole"
                }
              ]
            }''',
        )

    try:
        iam.get_role_policy(
            RoleName='lambda_feature_flipper',
            PolicyName='dynamodb',
        )
        print('lambda_feature_flipper role has needed inline policy')
    except iam.exceptions.NoSuchEntityException:
        ff = dynamodb.describe_table(TableName='FeatureFlipper')
        ffa = dynamodb.describe_table(TableName='FeatureFlipperAliases')

        policy_doc = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Stmt1428341300017",
                    "Action": [
                        "dynamodb:DeleteItem",
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:UpdateItem"
                    ],
                    "Effect": "Allow",
                    "Resource": ff['Table']['TableArn']
                },
                {
                    "Sid": "Stmt1428341300018",
                    "Action": [
                        "dynamodb:DeleteItem",
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:UpdateItem"
                    ],
                    "Effect": "Allow",
                    "Resource": ffa['Table']['TableArn']
                },
                {
                    "Sid": "Stmt1428341300019",
                    "Resource": "*",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Effect": "Allow"
                }
            ]
        }, indent=2)

        print('attaching inline policy to role lambda_feature_flipper')
        print(policy_doc)

        iam.put_role_policy(
            RoleName='lambda_feature_flipper',
            PolicyName='dynamodb',
            PolicyDocument=policy_doc,
        )


def ensure_s3_bucket():
    pass


deploy()
