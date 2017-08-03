.PHONY: default deploy node_modules

default: deploy

deploy:
	cd client && make deploy
	sleep 2 # don't hit rate limit
	cd server && make deploy

node_modules:
	cd client && make node_modules
