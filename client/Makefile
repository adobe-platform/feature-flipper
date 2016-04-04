#  Copyright 2016 Adobe Systems Incorporated. All rights reserved.
#  This file is licensed to you under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License. You may obtain a copy
#  of the License at http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software distributed under
#  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
#  OF ANY KIND, either express or implied. See the License for the specific language
#  governing permissions and limitations under the License.
.PHONY: default dev_image npm_install grunt server enter_dev_container \
	deploy_image deploy enter_deploy_container

default: grunt

#
# Development
#

dev_image:
	docker build -t feature-flipper-dev .

npm_install: dev_image
	docker run -it --rm \
	-v $$PWD:/usr/src/app \
	-w /usr/src/app \
	feature-flipper-dev \
	npm install

grunt: dev_image
	docker run -it --rm \
	-v $$PWD:/usr/src/app \
	-w /usr/src/app \
	-e NODE_ENV=production \
	feature-flipper-dev \
	npm run-script grunt

server: dev_image
	docker run -it --rm \
	-v $$PWD:/usr/src/app \
	-w /usr/src/app \
	-p 3000:3000 \
	feature-flipper-dev \
	npm run-script server

enter_dev_container: dev_image
	docker run -it --rm \
	-v $$PWD:/usr/src/app \
	-w /usr/src/app \
	feature-flipper-dev \
	/bin/bash

#
# Deployment
#

deploy_image: grunt
	docker build -t feature-flipper-deploy -f deploy.dockerfile .

deploy: deploy_image
	docker run -it --rm \
	-e AWS_ACCESS_KEY_ID=$$AWS_ACCESS_KEY_ID \
	-e AWS_SECRET_ACCESS_KEY=$$AWS_SECRET_ACCESS_KEY \
	-e AWS_DEFAULT_REGION=$$AWS_DEFAULT_REGION \
	-e S3_BUCKET=$$S3_BUCKET \
	feature-flipper-deploy

enter_deploy_container: deploy_image
	docker run -it --rm \
	-e AWS_ACCESS_KEY_ID=$$AWS_ACCESS_KEY_ID \
	-e AWS_SECRET_ACCESS_KEY=$$AWS_SECRET_ACCESS_KEY \
	-e AWS_DEFAULT_REGION=$$AWS_DEFAULT_REGION \
	-e S3_BUCKET=$$S3_BUCKET \
	feature-flipper-deploy /bin/bash
