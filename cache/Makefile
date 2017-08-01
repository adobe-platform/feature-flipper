.PHONY: default run build test prebuild godep_reset godep_save

default: run

run: build
	docker run -it --rm \
	-p 2005:2005 \
	-e AWS_ACCESS_KEY_ID=$$AWS_ACCESS_KEY_ID \
	-e AWS_SECRET_ACCESS_KEY=$$AWS_SECRET_ACCESS_KEY \
	-e AWS_SESSION_TOKEN=$$AWS_SESSION_TOKEN \
	-e AWS_SECURITY_TOKEN=$$AWS_SECURITY_TOKEN \
	-e AWS_DEFAULT_REGION=$$AWS_DEFAULT_REGION \
	-e FEATURE_FLIPPER_URI=$$FEATURE_FLIPPER_URI \
	-e PORT=2005 \
	feature-flipper-cache

build: prebuild
	docker build -t feature-flipper-cache .

test: prebuild
	docker build -t feature-flipper-cache-test -f Dockerfile.test .
	docker run -it --rm \
	-v $$PWD:/go/src/github.com/adobe-platform/feature-flipper-cache \
	-w /go/src/github.com/adobe-platform/feature-flipper-cache \
	feature-flipper-cache-test

prebuild:
	gofmt -s -w .
	go vet ./api ./cache ./config ./constants ./logger ./middleware ./util

# blow out any changes to the Godeps folder
godep_reset:
	git reset -- Godeps vendor
	git checkout -- Godeps vendor
	git clean -df Godeps vendor

godep:
	docker build -t feature-flipper-cache-godep -f Dockerfile.godep .
	docker run \
	-it --rm \
	-v $$PWD:/go/src/github.com/adobe-platform/feature-flipper-cache \
	-w /go/src/github.com/adobe-platform/feature-flipper-cache \
	feature-flipper-cache-godep

release: prebuild
	docker build -t $$FF_CACHE_TAG .
	docker push $$FF_CACHE_TAG
