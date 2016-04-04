.PHONY: default deploy

default: deploy

deploy:
	cd client && make deploy
	sleep 2 # don't hit rate limit
	cd server && make deploy

npm_install:
	cd client && make npm_install
