.PHONY: deploy

deploy:
	cd client && make deploy
	sleep 2 # don't hit rate limit
	cd server && make deploy
