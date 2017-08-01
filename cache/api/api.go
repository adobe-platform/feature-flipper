/*
 * (c) 2017 Adobe.  All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
package api

import (
	"context"
	"encoding/json"
	"io"
	"net/http"

	"github.com/adobe-platform/feature-flipper/cache"
	"github.com/adobe-platform/feature-flipper/config"
	"github.com/adobe-platform/feature-flipper/middleware"
)

/*
GET /sets
{
  "features": [
    "foo_service"
  ]
}
*/

/*
GET /sets/foo_service/features
{
  "featureSets": {
    "some_test": {
      "aliases": [
        "abc123"
      ]
    }
  }
}*/

type (
	FeatureSetsResponse struct {
		Sets map[string]FeatureSetResponse `json:"featureSets"`
	}

	FeatureSetResponse struct {
		Aliases []string `json:"aliases,omitempty"`
	}
)

func FeatureSetsHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) {

	log := middleware.GetRequestLog(ctx)

	featureSets, getFeatureSetsSuccess := cache.GetFeatureSets(log)
	if !getFeatureSetsSuccess || featureSets == nil {
		w.WriteHeader(500)
		return
	}

	mFeatureSetResponse := make(map[string]FeatureSetResponse)
	featureSetsResponse := FeatureSetsResponse{
		Sets: mFeatureSetResponse,
	}

	for setName := range featureSets {

		mFeatureSetResponse[setName] = FeatureSetResponse{
			Aliases: cache.GetFeatureSetAliases(log, setName),
		}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(featureSetsResponse); err != nil {
		log.Error("json.Marshal", "Error", err)
		w.WriteHeader(500)
	}
}

func FeatureSetAliasesHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) {
	log := middleware.GetRequestLog(ctx)
	ps := middleware.GetParams(ctx)
	setId := ps.ByName("set_id")

	fsr := FeatureSetResponse{
		Aliases: cache.GetFeatureSetAliases(log, setId),
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(fsr); err != nil {
		log.Error("json.Marshal", "Error", err)
		w.WriteHeader(500)
	}
}

func FeaturesForSetHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) {

	log := middleware.GetRequestLog(ctx)
	ps := middleware.GetParams(ctx)
	setId := ps.ByName("set_id")

	featureSet, exists, getFeaturesForSetSuccess := cache.GetFeaturesForSet(log, setId)
	if !exists {
		w.WriteHeader(404)
		return
	} else if !getFeaturesForSetSuccess {
		// cache.GetFeaturesForSet logs errors
		w.WriteHeader(500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(featureSet); err != nil {
		log.Error("json.Marshal", "Error", err)
		w.WriteHeader(500)
	}
}

func FeaturesForUserHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) {

	log := middleware.GetRequestLog(ctx)
	ps := middleware.GetParams(ctx)
	setId := ps.ByName("set_id")
	userId := ps.ByName("user_id")

	if userId == "" {
		FeaturesForSetHandler(ctx, w, r)
		return
	}

	featuresForUserURL := config.FeatureFlipperUri() + "/set/" + setId + "/features?user_id=" + userId
	featuresResp, err := http.Get(featuresForUserURL)
	if err != nil {
		log.Error("GET", "URL", featuresForUserURL, "Error", err)
		w.WriteHeader(500)
		return
	}
	defer featuresResp.Body.Close()

	if featuresResp.StatusCode != 200 {
		log.Error("GET", "URL", featuresForUserURL, "Status", featuresResp.Status)
		w.WriteHeader(featuresResp.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	_, err = io.Copy(w, featuresResp.Body)
	if err != nil {
		log.Error("io.Copy", "Error", err)
		w.WriteHeader(500)
		return
	}
}
