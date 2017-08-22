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
import os

dynamodb = boto3.client('dynamodb')
autoscaling = boto3.client('application-autoscaling')
iam = boto3.client('iam')
s3 = boto3.client('s3')
r53 = boto3.client('route53')

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

s3_bucket = os.environ['S3_BUCKET']
r53_domain = os.environ['R53_DOMAIN']
aws_default_region = os.environ['AWS_DEFAULT_REGION']

if s3_bucket == '':
    print('missing environment variable S3_BUCKET')
    exit(2)

if s3_bucket[-1:] == '.':
    print('S3_BUCKET includes a trailing .')
    exit(2)

if r53_domain == '':
    print('missing environment variable R53_DOMAIN')
    exit(2)

if r53_domain[-1:] == '.':
    print('R53_DOMAIN includes a trailing .')
    exit(2)

if aws_default_region == '':
    print('missing environment variable AWS_DEFAULT_REGION')
    exit(2)

if not s3_bucket.endswith(r53_domain):
    print("the suffix of {} must be {}".format(s3_bucket, r53_domain))
    exit(2)


def deploy():
    ensure_tables()
    ensure_lambda_role()
    ensure_autoscaling_role()
    ensure_autoscaling()
    ensure_s3_bucket()
    ensure_r53_alias()


def ensure_tables():
    try:
        dynamodb.describe_table(TableName='FeatureFlipper')
        print('FeatureFlipper DynamoDB table exists')
    except dynamodb.exceptions.ResourceNotFoundException:
        print('creating FeatureFlipper DynamoDB table')
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
                'ReadCapacityUnits': 1,
                'WriteCapacityUnits': 1
            },
        )

    try:
        dynamodb.describe_table(TableName='FeatureFlipperAliases')
        print('FeatureFlipperAliases DynamoDB table exists')
    except dynamodb.exceptions.ResourceNotFoundException:
        print('creating FeatureFlipperAliases DynamoDB table')
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
                'ReadCapacityUnits': 1,
                'WriteCapacityUnits': 1
            },
        )


def ensure_lambda_role():
    try:
        iam.get_role(RoleName='feature_flipper_lambda')
        print('feature_flipper_lambda IAM role exists')
    except iam.exceptions.NoSuchEntityException:
        print('creating IAM role feature_flipper_lambda')
        iam.create_role(
            RoleName='feature_flipper_lambda',
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
            RoleName='feature_flipper_lambda',
            PolicyName='dynamodb',
        )
        print('feature_flipper_lambda role has needed inline policy')
    except iam.exceptions.NoSuchEntityException:
        ff = dynamodb.describe_table(TableName='FeatureFlipper')
        ffa = dynamodb.describe_table(TableName='FeatureFlipperAliases')

        policy_doc = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": [
                        "dynamodb:DeleteItem",
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:UpdateItem"
                    ],
                    "Effect": "Allow",
                    "Resource": [
                        ff['Table']['TableArn'],
                        ffa['Table']['TableArn']
                    ]
                },
                {
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

        print('attaching inline policy to role feature_flipper_lambda')
        print(policy_doc)

        iam.put_role_policy(
            RoleName='feature_flipper_lambda',
            PolicyName='dynamodb',
            PolicyDocument=policy_doc,
        )


def ensure_autoscaling_role():
    try:
        iam.get_role(RoleName='feature_flipper_autoscaling')
        print('feature_flipper_autoscaling IAM role exists')
    except iam.exceptions.NoSuchEntityException:
        print('creating IAM role feature_flipper_autoscaling')
        iam.create_role(
            RoleName='feature_flipper_autoscaling',
            AssumeRolePolicyDocument='''{
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Principal": {
                    "Service": "application-autoscaling.amazonaws.com"
                  },
                  "Action": "sts:AssumeRole"
                }
              ]
            }''',
        )

    try:
        iam.get_role_policy(
            RoleName='feature_flipper_autoscaling',
            PolicyName='dynamodb',
        )
        print('feature_flipper_autoscaling role has needed inline policy')
    except iam.exceptions.NoSuchEntityException:
        ff = dynamodb.describe_table(TableName='FeatureFlipper')
        ffa = dynamodb.describe_table(TableName='FeatureFlipperAliases')

        policy_doc = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "cloudwatch:PutMetricAlarm",
                        "cloudwatch:DescribeAlarms",
                        "cloudwatch:DeleteAlarms"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:DescribeTable",
                        "dynamodb:UpdateTable"
                    ],
                    "Resource": [
                        ff['Table']['TableArn'],
                        ffa['Table']['TableArn']
                    ]
                }
            ]
        }, indent=2)

        print('attaching inline policy to role feature_flipper_autoscaling')
        print(policy_doc)

        iam.put_role_policy(
            RoleName='feature_flipper_autoscaling',
            PolicyName='dynamodb',
            PolicyDocument=policy_doc,
        )


def ensure_autoscaling():
    role = iam.get_role(RoleName='feature_flipper_autoscaling')
    role_arn = role['Role']['Arn']
    read_settings = {
        'ScalableDimension': 'dynamodb:table:ReadCapacityUnits',
        'PredefinedMetricType': 'DynamoDBReadCapacityUtilization',
        'MinCapacity': 1,
        'MaxCapacity': 500,
        'ScaleInCooldown': 300,
        'ScaleOutCooldown': 60,
    }
    write_settings = {
        'ScalableDimension': 'dynamodb:table:WriteCapacityUnits',
        'PredefinedMetricType': 'DynamoDBWriteCapacityUtilization',
        'MinCapacity': 1,
        'MaxCapacity': 50,
        'ScaleInCooldown': 60,
        'ScaleOutCooldown': 60,
    }
    for resource_id in ['table/FeatureFlipper', 'table/FeatureFlipperAliases']:
        for setting in [read_settings, write_settings]:
            scalable_target = autoscaling.describe_scalable_targets(
                ServiceNamespace='dynamodb',
                ResourceIds=[resource_id],
                ScalableDimension=setting['ScalableDimension'],
                MaxResults=1
            )
            if len(scalable_target['ScalableTargets']) == 1:
                print("found scalable target for {} {}".format(resource_id, setting['ScalableDimension']))
            else:
                print("creating scalable target for {} {}".format(resource_id, setting['ScalableDimension']))
                autoscaling.register_scalable_target(
                    ServiceNamespace='dynamodb',
                    ResourceId=resource_id,
                    ScalableDimension=setting['ScalableDimension'],
                    MinCapacity=setting['MinCapacity'],
                    MaxCapacity=setting['MaxCapacity'],
                    RoleARN=role_arn
                )

            print("put scale policy for {} {}".format(resource_id, setting['ScalableDimension']))
            autoscaling.put_scaling_policy(
                PolicyName=setting['PredefinedMetricType'],
                ServiceNamespace='dynamodb',
                ResourceId=resource_id,
                ScalableDimension=setting['ScalableDimension'],
                PolicyType='TargetTrackingScaling',
                TargetTrackingScalingPolicyConfiguration={
                    'TargetValue': 80.0,
                    'PredefinedMetricSpecification': {
                        'PredefinedMetricType': setting['PredefinedMetricType']
                    },
                    'ScaleOutCooldown': setting['ScaleOutCooldown'],
                    'ScaleInCooldown': setting['ScaleInCooldown']
                }
            )


def ensure_s3_bucket():
    try:
        s3.head_bucket(
            Bucket=s3_bucket
        )
        print("{} S3 bucket exists".format(s3_bucket))
    except s3.exceptions.ClientError:
        print("creating S3 bucket {}".format(s3_bucket))
        s3.create_bucket(
            ACL='private',
            Bucket=s3_bucket,
            CreateBucketConfiguration={
                'LocationConstraint': aws_default_region
            },
        )

    try:
        s3.get_bucket_website(
            Bucket=s3_bucket
        )
        print("S3 bucket is configured for static site hosting")
    except s3.exceptions.ClientError:
        print("configuring S3 bucket {} for static site hosting".format(s3_bucket))
        s3.put_bucket_website(
            Bucket=s3_bucket,
            WebsiteConfiguration={
                'ErrorDocument': {
                    'Key': 'error.html'
                },
                'IndexDocument': {
                    'Suffix': 'index.html'
                },
            }
        )


def ensure_r53_alias():
    hosted_zone_id = None

    while True:
        marker = None
        hosted_zones = None
        if marker is None:
            hosted_zones = r53.list_hosted_zones()
        else:
            hosted_zones = r53.list_hosted_zones(Marker=marker)

        for zone in hosted_zones['HostedZones']:
            if zone['Name'][:-1] == r53_domain:
                hosted_zone_id = zone['Id']
                break

        if hosted_zone_id is not None:
            break

        if 'NextToken' in hosted_zones:
            marker = hosted_zones['NextToken']
        else:
            marker = None

        if marker is None:
            break

    if hosted_zone_id is None:
        print('could not find hosted zone id for {}'.format(r53_domain))
        exit(1)

    print('UPSERT {}'.format(s3_bucket))
    r53.change_resource_record_sets(
        HostedZoneId=hosted_zone_id,
        ChangeBatch={
            'Changes': [
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': s3_bucket,
                        'Type': 'A',
                        'AliasTarget': {
                            'HostedZoneId': S3_HOSTED_ZONES[aws_default_region],
                            'DNSName': 's3-website-{}.amazonaws.com'.format(aws_default_region),
                            'EvaluateTargetHealth': False
                        },
                    }
                },
            ]
        }
    )

deploy()
