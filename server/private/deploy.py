#  Copyright 2016 Adobe Systems Incorporated. All rights reserved.
#  This file is licensed to you under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License. You may obtain a copy
#  of the License at http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software distributed under
#  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
#  OF ANY KIND, either express or implied. See the License for the specific language
#  governing permissions and limitations under the License.
import boto3
import os
import time

apigateway = boto3.client('apigateway')
lambdaClient = boto3.client('lambda')
accessControlAllowOrigin = os.environ['ACCESS_CONTROL_ALLOW_ORIGIN']
if accessControlAllowOrigin == "":
    accessControlAllowOrigin = "*"

REQUEST_TEMPLATE = '''{
  "http_method": "$context.httpMethod",
  "resource_path": "$context.resourcePath",
  "body": $input.json(\'$\'),
  "headers": {
    "if-match": "$input.params().header.get('If-Match')"
  },
  "set_id": "$input.params('set_id')",
  "alias_id": "$input.params('alias_id')"
}'''

FUNCTION_NAME = 'feature-flipper-private'

httpStatuses = [200, 400, 404, 409, 500]


def deploy():
    restApiId = ensure_api()
    ensure_resources(restApiId)
    ensure_lambda_permission(restApiId)
    do_deployment(restApiId)


def ensure_api():
    rest_apis = apigateway.get_rest_apis()
    for item in rest_apis['items']:
        if item['name'] == 'FeatureFlipper-private':
            print("found rest api id", item['id'])
            return item['id']

    restApi = apigateway.create_rest_api(
        name='FeatureFlipper-private',
        description='Adobe Feature Flipper'
    )
    print("created rest api", "rest api id", item['id'])

    return restApi['id']


def do_deployment(restApiId):
    apigateway.create_deployment(
        restApiId=restApiId,
        stageName='prod',
        stageDescription='prod',
        cacheClusterEnabled=False
    )
    print("created deployment")


def ensure_resources(restApiId):
    resourcesResp = apigateway.get_resources(restApiId=restApiId)
    # print(resourcesResp)

    # tear down existing resources
    for item in resourcesResp['items']:

        if item['path'] == "/":
            rootId = item['id']
        else:
            try:
                apigateway.delete_resource(
                    restApiId=restApiId,
                    resourceId=item['id']
                )
            except Exception:
                pass

    create_route(restApiId, rootId, "sets", ["GET"])
    setId = create_route(restApiId, rootId, "set", ["POST"])
    setSetId = create_route(restApiId, setId, ":set_id", ["GET", "PUT", "DELETE"])
    create_route(restApiId, setSetId, "aliases", ["GET", "POST"])

    aliasId = create_route(restApiId, rootId, "alias", [])
    create_route(restApiId, aliasId, ":alias_id", ["DELETE"])


def create_route(restApiId, parentId, path, httpMethods):
    time.sleep(1)
    print("creating route", path, httpMethods)

    requestParameters = {
        "method.request.header.If-Match": False
    }

    if len(path) > 0 and path[0] == ":":
        pathPart = '{' + path[1:len(path)] + '}'
        requestParameters['method.request.path.' + path[1:len(path)]] = True
    else:
        pathPart = path

    print(
        'create_resource',
        'restApiId', restApiId,
        'parentId', parentId,
        'pathPart', pathPart
    )
    resource = apigateway.create_resource(
        restApiId=restApiId,
        parentId=parentId,
        pathPart=pathPart
    )
    resourceId = resource['id']

    corsPathSupport(restApiId, resourceId)

    for httpMethod in httpMethods:
        time.sleep(0.5)

        print(
            'put_method',
            'restApiId', restApiId,
            'resourceId', resourceId,
            'httpMethod', httpMethod
        )
        apigateway.put_method(
            restApiId=restApiId,
            resourceId=resourceId,
            httpMethod=httpMethod,
            authorizationType='NONE',
            apiKeyRequired=True,
            requestParameters=requestParameters
        )

        print(
            'put_integration',
            'restApiId', restApiId,
            'resourceId', resourceId,
            'httpMethod', httpMethod,
            'uri', functionIntegrationURI
        )
        apigateway.put_integration(
            restApiId=restApiId,
            resourceId=resourceId,
            httpMethod=httpMethod,
            type='AWS',
            integrationHttpMethod='POST',
            uri=functionIntegrationURI,
            requestTemplates={
                'application/json': REQUEST_TEMPLATE
            }
        )

        # enable throwing exceptions with status codes to actually return the
        # status code. COME ON api gateway
        for statusCode in httpStatuses:
            time.sleep(0.5)

            statusCode = str(statusCode)

            if statusCode == "200":
                if httpMethod == "POST":
                    statusCode = "201"
                elif httpMethod == "PUT":
                    statusCode = "204"

                # default mapping
                selectionPattern = ""
            else:
                selectionPattern = statusCode

            methodRespParameters = {
                'method.response.header.ETag': False
            }
            corsMethodResponseParameters(methodRespParameters)

            integrationRespParameters = {
                # https://forums.aws.amazon.com/thread.jspa?threadID=203889
                # TODO change this this once lambda responses can include headers
                'method.response.header.ETag': 'integration.response.body.ETag'
            }
            corsIntegrationResponseParameters(integrationRespParameters)

            apigateway.put_method_response(
                restApiId=restApiId,
                resourceId=resourceId,
                httpMethod=httpMethod,
                statusCode=statusCode,
                responseParameters=methodRespParameters
            )

            apigateway.put_integration_response(
                restApiId=restApiId,
                resourceId=resourceId,
                httpMethod=httpMethod,
                statusCode=statusCode,
                selectionPattern=selectionPattern,
                responseParameters=integrationRespParameters
            )

    return resource['id']


# Add OPTIONS method to the given resource
def corsPathSupport(restApiId, resourceId):
    print(
        'put_method',
        'restApiId', restApiId,
        'resourceId', resourceId,
        'httpMethod', "OPTIONS"
    )
    apigateway.put_method(
        restApiId=restApiId,
        resourceId=resourceId,
        httpMethod="OPTIONS",
        authorizationType='NONE',
        apiKeyRequired=False
    )

    print(
        'put_integration',
        'restApiId', restApiId,
        'resourceId', resourceId,
        'httpMethod', "OPTIONS",
        'uri', functionIntegrationURI
    )
    apigateway.put_integration(
        restApiId=restApiId,
        resourceId=resourceId,
        httpMethod="OPTIONS",
        type='MOCK',
        requestTemplates={
            'application/json': "{\"statusCode\": 200}"
        }
    )

    apigateway.put_method_response(
        restApiId=restApiId,
        resourceId=resourceId,
        httpMethod="OPTIONS",
        statusCode="200",
        responseParameters=corsMethodResponseParameters({})
    )

    apigateway.put_integration_response(
        restApiId=restApiId,
        resourceId=resourceId,
        httpMethod="OPTIONS",
        statusCode="200",
        selectionPattern="",
        responseParameters=corsIntegrationResponseParameters({})
    )


def corsMethodResponseParameters(responseParameters):
    responseParameters['method.response.header.Access-Control-Allow-Headers'] = False
    responseParameters['method.response.header.Access-Control-Allow-Methods'] = False
    responseParameters['method.response.header.Access-Control-Allow-Origin'] = False
    responseParameters['method.response.header.Access-Control-Expose-Headers'] = False
    return responseParameters


def corsIntegrationResponseParameters(responseParameters):
    responseParameters['method.response.header.Access-Control-Allow-Headers'] = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,If-Match'"
    responseParameters['method.response.header.Access-Control-Allow-Methods'] = "'GET,POST,PUT,DELETE,OPTIONS'"
    responseParameters['method.response.header.Access-Control-Allow-Origin'] = "'{}'".format(accessControlAllowOrigin)
    responseParameters['method.response.header.Access-Control-Expose-Headers'] = "'ETag'"
    return responseParameters


def ensure_lambda_permission(restApiId):
    # e.g. arn:aws:lambda:us-west-2:123456789012:function:function-name
    functionArnParts = functionArn.split(':')
    if len(functionArnParts) != 7:
        raise Exception("unexpected function ARN format")

    accountId = functionArnParts[4]

    # e.g. arn:aws:execute-api:us-east-1:1234567890:nh501ngr19/*/GET/test/petstorewalkthrough/pets
    sourceArn = os.path.expandvars('arn:aws:execute-api:$AWS_DEFAULT_REGION:{}:{}/*')
    sourceArn = sourceArn.format(accountId, restApiId)

    statementId = 'apigateway_perm'

    try:
        lambdaClient.remove_permission(
            FunctionName=FUNCTION_NAME,
            StatementId=statementId
        )
    except Exception:
        pass
    finally:
        lambdaClient.add_permission(
            FunctionName=FUNCTION_NAME,
            StatementId=statementId,
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=sourceArn
        )


functionInfo = lambdaClient.get_function(FunctionName=FUNCTION_NAME)
functionArn = functionInfo['Configuration']['FunctionArn']

# the 2015-03-31 in this path is a bit magical and i never found out how
# to discover it so hopefully it doesn't break
functionIntegrationURI = os.path.expandvars('arn:aws:apigateway:$AWS_DEFAULT_REGION:lambda:path/2015-03-31/functions')
functionIntegrationURI = functionIntegrationURI + '/' + functionArn + '/invocations'

deploy()
