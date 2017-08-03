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

After these resources are in place the remainder of the deployment is done with
a simple command that does quite a lot and includes:

1. Building and uploading the SPA to S3
1. Uploading lambda function code
1. Creating DynamoDB tables for feature data
1. Creating an IAM role enabling Lambda functions to access DynamoDB tables
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

### Deploy for the first time

If you did `cd server && make enter_deploy_container` above, exit the container
now and `cd ..` to get back to the repo root.

```bash
make node_modules deploy
```

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

make
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
