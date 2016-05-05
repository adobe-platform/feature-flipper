Deployment
==========

Dependencies
------------

### AWS CLI

A properly configured AWS CLI is required. If you don't have one locally you can
set the needed environment variables as to [configure the CLI](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-environment),
then use the deployment container (which has the CLI installed) by typing from
the repo root:

`cd server && make enter_deploy_container`

### Docker

A working Docker installation is required.

A working Docker installation looks like this:

```
[you:~]$ docker version
Client:
 Version:      1.10.2
 API version:  1.22
 Go version:   go1.5.3
 Git commit:   c3959b1
 Built:        Mon Feb 22 22:37:33 2016
 OS/Arch:      darwin/amd64

Server:
 Version:      1.10.2
 API version:  1.22
 Go version:   go1.5.3
 Git commit:   c3959b1
 Built:        Mon Feb 22 22:37:33 2016
 OS/Arch:      linux/amd64
```

One-time setup
--------------

Deployment of the feature flipper requires some one-time manual setup to get
running. This includes:

1. A S3 bucket with static site hosting turned on for the SPA
1. A Route53 alias to the bucket
1. DynamoDB tables for feature data
1. An IAM role enabling Lambda functions to access DynamoDB tables
1. A API Gateway API key to restrict access to the SPA so feature data is protected

After these resources are in place the remainder of the deployment is done with
a simple command that does quite a lot and includes:

1. Building and uploading the SPA to S3
1. Uploading lambda function code
1. Tearing down old API Gateway routes
1. Creating new API routes. For each route
  1. Configuring the method request
  1. Configuring the integration request
  1. Configuring the integration response
  1. Configuring the method response
1. Adding permissions in the lambda function so API Gateway can call it
1. Creating a API Gateway deployment

### Set your AWS credentials

```bash
export AWS_ACCESS_KEY_ID=<access key>
export AWS_SECRET_ACCESS_KEY=<secret>
export AWS_DEFAULT_REGION=<your region>
```

### Create a S3 bucket

For static site hosting the bucket name matters. In this example we'll use
`feature-flipper.yourdomain.com` throughout the initial setup and deployment.
Additionally your account id will be different than `123456789012` so everywhere
you see `123456789012` replace it with your account id.

Setup your environment variables

```bash
# The bucket from which to serve the SPA
export S3_BUCKET=feature-flipper.yourdomain.com

# for CORS
export ACCESS_CONTROL_ALLOW_ORIGIN=http://$S3_BUCKET
```

Create the bucket and enable static site hosting

```bash
aws s3api create-bucket \
--bucket $S3_BUCKET \
--grant-read uri=http://acs.amazonaws.com/groups/global/AllUsers \
--create-bucket-configuration LocationConstraint=$AWS_DEFAULT_REGION

aws s3api put-bucket-website \
--bucket $S3_BUCKET \
--website-configuration '{"IndexDocument":{"Suffix":"index.html"},"ErrorDocument":{"Key":"error.html"}}'
```

### Create a Route53 alias

AWS doesn't expose an API to [get the HostedZoneID of a S3 bucket](https://forums.aws.amazon.com/thread.jspa?threadID=116724)
meaning this step has to be done in the console.

1. Go to the Route53 console
1. Click on your domain `yourdomain.com.`
1. Click "Create Record Set"
1. Type "feature-flipper" in the "Name" field
1. Leave "Type" as "A - IPv4 Address"
1. Click the "Yes" radio button for "Alias"
1. Click the "Alias Target" dropdown. Wait for S3 website endpoints to populate.
1. Click the "feature-flipper.yourdomain.com" bucket
1. Click "Create"

DNS propagation for aliases can take some time so continue to the next step.

### Create DynamoDB tables

```bash
aws dynamodb create-table \
--attribute-definitions AttributeName=FeatureSet,AttributeType=S \
--table-name FeatureFlipper \
--key-schema AttributeName=FeatureSet,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=1

aws dynamodb create-table \
--attribute-definitions AttributeName=Alias,AttributeType=S \
--table-name FeatureFlipperAliases \
--key-schema AttributeName=Alias,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=1
```

The output of these commands is a JSON string containing the ARN of the table
which you will need in later steps.

```json
{
    "TableDescription": {
        "TableArn": "arn:aws:dynamodb:us-west-2:123456789012:table/FeatureFlipper",
    }
}
```

```json
{
    "TableDescription": {
        "TableArn": "arn:aws:dynamodb:us-west-2:123456789012:table/FeatureFlipperAliases",
    }
}
```

### Create the Lambda function IAM role

```bash
aws iam create-role \
--role-name lambda_feature_flipper \
--assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Sid":"","Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
```

Now attach an inline policy allowing the role to access the DynamoDB tables
created earlier. Replace the `"Resource"` keys in this policy document with the
ARNs of the DynamoDB tables.

```bash
aws iam put-role-policy \
--role-name lambda_feature_flipper \
--policy-name dynamodb \
--policy-document '{
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
      "Resource": "arn:aws:dynamodb:us-west-2:123456789012:table/FeatureFlipper"
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
      "Resource": "arn:aws:dynamodb:us-west-2:123456789012:table/FeatureFlipperAliases"
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
}'
```

### Create the Lambda functions

The step of deploying the actual code comes later. For now just create the
functions with empty code.

```bash
echo '' > delete_me
zip delete_me.zip delete_me

aws lambda create-function \
    --function-name feature-flipper-public \
    --runtime python2.7 \
    --role arn:aws:iam::123456789012:role/lambda_feature_flipper \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://delete_me.zip

aws lambda create-function \
    --function-name feature-flipper-private \
    --runtime python2.7 \
    --role arn:aws:iam::123456789012:role/lambda_feature_flipper \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://delete_me.zip

rm delete_me*
```

### Deploy for the first time

With the lambda functions created it's time to do the first deployment.

If you did `cd server && make enter_deploy_container` above, exit the container
now and `cd ..` to get back to the repo root.

```bash
make node_modules deploy
```

### Create an API key

AWS doesn't expose an API for creating an API key and associating it with a API
Gateway stage.

1. Go to the API Gateway console
1. Click the dropdown next to "Amazon API Gateway"
1. Click "API Keys"
1. Click "Create API Key"
1. Give it a name and click "Save"
1. Click on the key you just created
1. Under "API Stage Association > Select API" click "FeatureFlipper-private"
1. Under "API Stage Association > Select stage" click "prod"
1. Click "Save" to associate the API key

This key is what you use to login to the SPA.

Deploying and upgrading an existing deployment
----------------------------------------------

To deploy or update the feature flipper simply run this from the repo root:

```bash
# Optionally set this if you want the public consumers of feature data to
# authenticate with an api key. If you set this you must also associate the API
# key with the FeatureFlipper-public deployment stage
# export REQUIRE_API_KEY=1

# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION, S3_BUCKET, and
# ACCESS_CONTROL_ALLOW_ORIGIN should still be set

make deploy
```

Logging in
==========

To login to the SPA go to http://feature-flipper.yourdomain.com

The frontend needs to know which API Gateway endpoint to talk to, and it needs
and API key to authenticate. The API key was created above. Here's how to find
the endpoint:

The endpoint is found in the API Gateway console

1. Go to the API Gateway console
1. Click "FeatureFlipper-private"
1. Click the "Resources" dropdown
1. Click "Stages"
1. Click "prod"
1. Copy the "Invoke URL" and paste it into the login prompt at feature-flipper.yourdomain.com
