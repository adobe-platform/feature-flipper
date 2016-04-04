Client API
==========

This describes the API for consumers of the `FeatureFlipper-public` API.

When integrating with Android, iOS, or Javascript it may be more convenient to
generate a SDK. Find the "SDK generation" tab under the "prod" stage of the
FeatureFlipper-public API.

API
---

These API requests and responses are for a feature set
`PROD-BlogService-default` with 3 features

1. `comments` on for 100% of users
1. `threaded_comments` on for 10% of users
1. `new_admin_ui` on for 0% of users

and an alias of `preview_threaded_comments`

### GET /sets

**Request**

    GET /sets HTTP/1.1
    Accept: application/json

**Response**

    HTTP/1.1 200 OK
    Content-Type: application/json

    {
      "featureSets": [
        "PROD-BlogService-default"
      ]
    }

### GET /set/:set_id/features

Since this API isn't scoped to a particular user, only the features that are
on for 100% of users are returned to the client.

**Request**

    GET /set/PROD-BlogService-default/features HTTP/1.1
    Accept: application/json

**Response**

    HTTP/1.1 200 OK
    Content-Type: application/json

    {
      "features": [
        "comments"
      ]
    }

### GET /set/:set_id/features?user_id=\<user id\>

This endpoint allows returning features for a particular user, enabling canary releases.

Users are placed on a hash ring by creating a MD5 hash of their user id modulo
100. If the output of that value is less than the percentage specified for the
feature, then that user sees the feature.

This of course means that the users that land in position 0 on the ring will
always see features if they're turned on at all, and that users in position 99
on the ring will be the last to see a feature that's only partially released.

If that behavior is undesirable it's easy enough to add information
(e.g. `user_id + salt`) to the user id to force them to land on a different
position in the ring

**Request**

    GET /set/PROD-BlogService-default/features?user_id=me HTTP/1.1
    Accept: application/json

**Response**

    HTTP/1.1 200 OK
    Content-Type: application/json

    {
      "features": [
        "threaded_comments",
        "comments"
      ]
    }

**Request**

    GET /set/PROD-BlogService-default/features?user_id=me2 HTTP/1.1
    Accept: application/json

**Response**

    HTTP/1.1 200 OK
    Content-Type: application/json

    {
      "features": [
        "comments"
      ]
    }

### GET /set/:set_id/aliases

Aliases are useful as an alternative way to reference feature sets. Think of it
as a public link. Once created you can share it out for stakeholders to view a
particular feature set, then remove the alias so they no longer have access. Any
API (except this one) that takes a `:set_id` can also take an alias in its
place.

**Request**

    GET /set/PROD-BlogService-default/aliases HTTP/1.1
    Accept: application/json

**Response**

    HTTP/1.1 200 OK
    Content-Type: application/json

    {
      "aliases": [
        "preview_threaded_comments"
      ]
    }
