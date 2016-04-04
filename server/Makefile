.PHONY: default

default: upload_functions

deploy_image:
	docker build -t feature-flipper-server-deploy -f deploy.dockerfile .

virtualenv:
	docker build -t feature-flipper-virtualenv -f virtualenv.dockerfile .
	docker run --rm -v $$PWD:/host feature-flipper-virtualenv

zip_code: virtualenv
	rm -f public/lambda_function.zip
	rm -f private/lambda_function.zip

	cd public && zip -9 lambda_function.zip lambda_function.py
	cd virtualenv && zip -r9 ../public/lambda_function.zip ./*

	cd private && zip -9 lambda_function.zip lambda_function.py
	cd virtualenv && zip -r9 ../private/lambda_function.zip ./*

upload_functions: zip_code
	aws lambda update-function-code \
	--region us-west-2 \
	--function-name feature-flipper-public \
	--zip-file fileb://$$PWD/public/lambda_function.zip

	aws lambda update-function-code \
	--region us-west-2 \
	--function-name feature-flipper-private \
	--zip-file fileb://$$PWD/private/lambda_function.zip

deploy: virtualenv deploy_image
	docker run \
	-it --rm \
	-e AWS_ACCESS_KEY_ID=$$AWS_ACCESS_KEY_ID \
	-e AWS_SECRET_ACCESS_KEY=$$AWS_SECRET_ACCESS_KEY \
	-e AWS_DEFAULT_REGION=$$AWS_DEFAULT_REGION \
	-e ACCESS_CONTROL_ALLOW_ORIGIN=$$ACCESS_CONTROL_ALLOW_ORIGIN \
	-e REQUIRE_API_KEY=$$REQUIRE_API_KEY \
	feature-flipper-server-deploy

# helpful target to debug deployment issues
enter_deploy_container: deploy_image
	docker run \
	-it --rm \
	-e AWS_ACCESS_KEY_ID=$$AWS_ACCESS_KEY_ID \
	-e AWS_SECRET_ACCESS_KEY=$$AWS_SECRET_ACCESS_KEY \
	-e AWS_DEFAULT_REGION=$$AWS_DEFAULT_REGION \
	-e ACCESS_CONTROL_ALLOW_ORIGIN=$$ACCESS_CONTROL_ALLOW_ORIGIN \
	-e REQUIRE_API_KEY=$$REQUIRE_API_KEY \
	feature-flipper-server-deploy /bin/bash
