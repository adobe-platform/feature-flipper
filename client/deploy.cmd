#!/bin/bash

#  Copyright 2016 Adobe Systems Incorporated. All rights reserved.
#  This file is licensed to you under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License. You may obtain a copy
#  of the License at http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software distributed under
#  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
#  OF ANY KIND, either express or implied. See the License for the specific language
#  governing permissions and limitations under the License.

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
	echo "missing environment variable AWS_ACCESS_KEY_ID"
	exit 2
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
	echo "missing environment variable AWS_SECRET_ACCESS_KEY"
	exit 2
fi

if [ -z "$AWS_DEFAULT_REGION" ]; then
	echo "missing environment variable AWS_DEFAULT_REGION"
	exit 2
fi

if [ -z "$S3_BUCKET" ]; then
	echo "missing environment variable S3_BUCKET"
	exit 2
fi

cp index.html bin/
ls -alh bin
gzip -r bin
ls -alh bin

aws s3api put-object \
    --bucket "$S3_BUCKET" \
    --key "bin/ff.js" \
    --acl 'public-read' \
    --cache-control 'max-age=300' \
    --content-type 'text/javascript' \
    --content-encoding 'gzip' \
    --body "bin/ff.js.gz"

aws s3api put-object \
    --bucket "$S3_BUCKET" \
    --key "bin/ff.css" \
    --acl 'public-read' \
    --cache-control 'max-age=300' \
    --content-type 'text/css' \
    --content-encoding 'gzip' \
    --body "bin/ff.css.gz"

aws s3api put-object \
    --bucket "$S3_BUCKET" \
    --key 'index.html' \
    --acl 'public-read' \
    --cache-control 'max-age=300' \
    --content-type 'text/html' \
    --content-encoding 'gzip' \
    --body 'bin/index.html.gz'

aws s3api put-object \
    --bucket "$S3_BUCKET" \
    --key 'favicon.ico' \
    --acl 'public-read' \
    --cache-control 'max-age=300' \
    --content-type 'image/ico' \
    --body 'favicon.ico'
