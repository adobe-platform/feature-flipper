feature-flipper cache
=====================

This is a cache for the feature flipper that has proven itself over the past
year on multiple production deployments of Adobe services.

The API is identical to the [client API](../docs/client-api.md)

No caching is currently done for `GET /set/:set_id/features?user_id=\<user id\>`

Cache behavior
--------------

On a cache miss, if there is no data to return, the cache will call API Gateway
**synchronously**. On subsequent requests, if the TTL of the cached data has not
expired, the cache returns the data it has. If the TTL has expired it will
additionally make an **async** request to API Gateway to refresh its data. If
that request fails it will keep the last good set of data it has, otherwise it
will refresh the cache.

The above behavior is identical for the `GET /sets` and
`GET /set/:set_id/features` APIs. The only variation is on the TTLs.

### TTLs

TTL is the time for cache data to live before attempting to refresh it.

_These numbers are based on our usage patterns and scale at which we operate our
feature flipper and should probably be configurable. Currently they're
hardcoded._

Sets: 30 minutes

Set aliases: 1 hour

Features in a set: 10 minutes

Configuration
-------------

We typically follow 12-factor. The cache is configured with two environment
variables.

`PORT` the port to bind to

`FEATURE_FLIPPER_URI` the partial URL that the
[client API](../docs/client-api.md) paths will be appended to. An example is
`https://abcde12345.execute-api.us-west-2.amazonaws.com/prod`

Docker image
------------

A Docker image is available at `phylake/feature-flipper-cache`. The Docker tag
is a stripped down version of the git tag.

`https://github.com/adobe-platform/feature-flipper/tree/cache-v1.0.0`

equals

`phylake/feature-flipper-cache:1.0.0`
