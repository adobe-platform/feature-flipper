Deployment
==========

Dependencies
------------

### AWS CLI

A properly configured AWS CLI is required. If you don't have one locally you can
set the needed environment variables as to [configure the CLI](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-environment).

### Docker

A working Docker installation is required. Docker is not a runtime requirement
of the feature flipper and is only used to create a consistent deployment
environment.

A working Docker installation looks like this
(note the use of `version`, not `--version`):

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

Idempotent deployment
---------------------

The deployment scripts are idempotent. If you run into any issue while running
`make` just run it again. Some of what the deployment script do includes:

1. Creating a S3 bucket with static site hosting
1. Creating a Route53 alias to the bucket
1. Building and uploading the Single Page App (SPA) to S3
1. Creating DynamoDB tables for feature data
1. Creating Autoscaling policies for DynamoDB tables
1. Creating Lambda functions and uploading their code
1. Creating an IAM role enabling Lambda functions to access DynamoDB tables
1. Tearing down old API Gateway routes
1. Creating new API routes. For each route
    1. Configuring the method request
    1. Configuring the integration request
    1. Configuring the integration response
    1. Configuring the method response
1. Adding permissions in the lambda function so API Gateway can call it
1. Creating a API Gateway deployment

Configure your environment
--------------------------

### AWS creds

```bash
export AWS_ACCESS_KEY_ID=<access key>
export AWS_SECRET_ACCESS_KEY=<secret>
export AWS_DEFAULT_REGION=<your region>
```

### Feature Flipper config

```bash
# The Route53 domain. Make sure to remove the trailing .
export R53_DOMAIN=yourdomain.com

# The bucket from which to serve the SPA.
export S3_BUCKET="feature-flipper.$R53_DOMAIN"

# for CORS
export ACCESS_CONTROL_ALLOW_ORIGIN="http://$S3_BUCKET"
```

Deploying and upgrading an existing deployment
----------------------------------------------

To deploy or update the feature flipper simply run this from the repo root:

```bash
# Optionally set this if you want the public consumers of feature data to
# authenticate with an api key. If you set this you must also associate the API
# key with the FeatureFlipper-public deployment stage
# export REQUIRE_API_KEY=1

# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION, R53_DOMAIN,
# S3_BUCKET, and ACCESS_CONTROL_ALLOW_ORIGIN should still be set

make
```

Logging in
==========

To login to the SPA go to http://feature-flipper.yourdomain.com

The frontend needs to know which API Gateway endpoint to talk to, and it needs
and API key to authenticate. The API key was created above and printed out as
the last output. Here's how to find the endpoint:

The endpoint is found in the API Gateway console

1. Go to the API Gateway console
1. Click "FeatureFlipper-private"
1. Click the "Resources" dropdown
1. Click "Stages"
1. Click "prod"
1. Copy the "Invoke URL" and paste it into the login prompt at
   http://feature-flipper.yourdomain.com

The FeatureFlipper-public invoke URL is what the [node-local cache](../cache)
is configured with.
