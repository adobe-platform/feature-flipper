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
package cache

import (
	"encoding/json"
	"net/http"
	"sync/atomic"
	"time"

	"github.com/adobe-platform/feature-flipper/config"
	"github.com/adobe-platform/feature-flipper/util"
	"gopkg.in/inconshreveable/log15.v2"
)

const (
	CacheEmpty = iota
	CacheFillingSync
	CacheFillingAsync
	CacheFull
)

type (
	FeatureDataCache struct {
		cacheSignal      *int32
		cacheTouchTime   time.Time
		aliasesTouchTime time.Time

		featureSetToData map[string]*FeatureData
		aliasToSet       map[string]string
	}

	FeatureData struct {
		cacheSignal    *int32
		cacheTouchTime time.Time

		Version  int      `json:"version"`
		Features []string `json:"features"`
	}

	SetsResponseBody struct {
		FeatureSets []string `json:"featureSets"`
	}

	FeatureSetAliases struct {
		Aliases []string `json:"aliases"`
	}
)

var cache *FeatureDataCache

func init() {
	cache = New()
}

// Package API
func GetFeatureSets(log log15.Logger) (map[string]*FeatureData, bool) {
	return cache.GetFeatureSets(log)
}

// Package API
func GetFeaturesForSet(log log15.Logger, setName string) (*FeatureData, bool, bool) {
	return cache.GetFeaturesForSet(log, setName)
}

// Package API
func GetFeatureSetAliases(log log15.Logger, setName string) []string {
	return cache.GetFeatureSetAliases(log, setName)
}

// New and the FeatureDataCache struct provide better testability
func New() *FeatureDataCache {

	instance := &FeatureDataCache{
		cacheSignal:      new(int32),
		featureSetToData: make(map[string]*FeatureData),
		aliasToSet:       make(map[string]string),
	}

	return instance
}

func (c *FeatureDataCache) GetFeatureSets(log log15.Logger) (featureSets map[string]*FeatureData, success bool) {

	switch atomic.LoadInt32(c.cacheSignal) {
	// we've never retrieved feature data. do it synchronously.
	case CacheEmpty:

		if atomic.CompareAndSwapInt32(c.cacheSignal, CacheEmpty, CacheFillingSync) {

			retryMsg := func(i int) { log.Warn("populateFeatureData retrying", "Count", i) }
			if util.SuccessRetryer(3, retryMsg, func() bool {
				return c.populateFeatureData(log)
			}) {
				if !atomic.CompareAndSwapInt32(c.cacheSignal, CacheFillingSync, CacheFull) {
					log.Error("cas failed")
					return
				}
			} else {
				if !atomic.CompareAndSwapInt32(c.cacheSignal, CacheFillingSync, CacheEmpty) {
					log.Error("cas failed")
					return
				}
			}
		} else {
			log.Error("cas failed")
			return
		}

	// we've retrieved feature data so we have a response to give.
	// refresh feature data asychronously.
	case CacheFull:
		if time.Since(c.cacheTouchTime) >= 30*time.Minute && atomic.CompareAndSwapInt32(c.cacheSignal, CacheFull, CacheFillingAsync) {
			go func(log log15.Logger) {
				c.populateFeatureData(log)
				if !atomic.CompareAndSwapInt32(c.cacheSignal, CacheFillingAsync, CacheFull) {
					log.Error("cas failed")
				}
			}(log)
		}

	case CacheFillingSync:

		// spin until sync fetch completes
		for sig := atomic.LoadInt32(c.cacheSignal); sig == CacheFillingSync; {
			time.Sleep(100 * time.Millisecond)
		}
	}

	featureSets = c.featureSetToData
	success = true
	return
}

func (c *FeatureDataCache) GetFeaturesForSet(log log15.Logger, setName string) (featureData *FeatureData, exists bool, success bool) {

	featureSets, getFeatureSetsSuccess := c.GetFeatureSets(log)
	if !getFeatureSetsSuccess {
		return
	}

	if featureSets != nil {
		// setName could be an alias
		if realSetName, ok := c.aliasToSet[setName]; ok {
			setName = realSetName
			featureData, exists = featureSets[realSetName]
		} else {
			featureData, exists = featureSets[setName]
		}
	}

	if !exists {
		return
	}

	switch atomic.LoadInt32(featureData.cacheSignal) {
	// we've never retrieved feature data. do it synchronously.
	case CacheEmpty:

		if atomic.CompareAndSwapInt32(featureData.cacheSignal, CacheEmpty, CacheFillingSync) {

			retryMsg := func(i int) { log.Warn("populateFeatures retrying", "Count", i) }
			if util.SuccessRetryer(3, retryMsg, func() bool {
				return populateFeatures(log, setName, featureData)
			}) {
				if !atomic.CompareAndSwapInt32(featureData.cacheSignal, CacheFillingSync, CacheFull) {
					log.Error("cas failed")
					return
				}
			} else {
				if !atomic.CompareAndSwapInt32(featureData.cacheSignal, CacheFillingSync, CacheEmpty) {
					log.Error("cas failed")
					return
				}
			}
		} else {
			log.Error("cas failed")
			return
		}

	// we've retrieved feature data so we have a response to give.
	// refresh feature data asychronously.
	case CacheFull:
		if time.Since(featureData.cacheTouchTime) >= 2*time.Minute && atomic.CompareAndSwapInt32(featureData.cacheSignal, CacheFull, CacheFillingAsync) {
			go func(log log15.Logger) {
				populateFeatures(log, setName, featureData)
				if !atomic.CompareAndSwapInt32(featureData.cacheSignal, CacheFillingAsync, CacheFull) {
					log.Error("cas failed")
				}
			}(log)
		}

	case CacheFillingSync:

		// spin until sync fetch completes
		for sig := atomic.LoadInt32(featureData.cacheSignal); sig == CacheFillingSync; {
			time.Sleep(100 * time.Millisecond)
		}
	}

	success = true
	return
}

func (c *FeatureDataCache) GetFeatureSetAliases(log log15.Logger, setName string) []string {

	c.GetFeatureSets(log)

	aliases := make([]string, 0)
	for alias, featureSet := range c.aliasToSet {
		if setName == featureSet {
			aliases = append(aliases, alias)
		}
	}

	return aliases
}

func populateFeatures(log log15.Logger, setName string, featureData *FeatureData) (success bool) {
	featuresUrl := config.FeatureFlipperUri() + "/set/" + setName + "/features"
	featuresRes, err := http.Get(featuresUrl)
	log.Info("GET " + featuresUrl)
	if err != nil {
		log.Error("GET", "URL", featuresUrl, "Error", err)
		return
	}
	defer featuresRes.Body.Close()
	if featuresRes.StatusCode != 200 {
		log.Error("GET", "URL", featuresUrl, "StatusCode", featuresRes.StatusCode)
		return
	}

	if err = json.NewDecoder(featuresRes.Body).Decode(featureData); err != nil {
		log.Error("json.Decode", "Error", err)
		return
	}

	featureData.cacheTouchTime = time.Now()
	success = true
	return
}

// populateFeatureData separates out the logic to populate featureSetToData from the
// locking required to do it in a concurrent environment
func (c *FeatureDataCache) populateFeatureData(log log15.Logger) (success bool) {
	log.Info("populateFeatureData")

	setsUrl := config.FeatureFlipperUri() + "/sets"
	setsRes, err := http.Get(setsUrl)
	log.Info("GET " + setsUrl)
	if err != nil {
		log.Error("GET", "URL", setsUrl, "Error", err)
		return
	}
	defer setsRes.Body.Close()
	if setsRes.StatusCode != 200 {
		log.Error("GET", "URL", setsUrl, "StatusCode", setsRes.StatusCode)
		return
	}

	setsResponseBody := SetsResponseBody{}

	if err = json.NewDecoder(setsRes.Body).Decode(&setsResponseBody); err != nil {
		log.Error("json.Decode", "Error", err)
		return
	}

	updateAliases := time.Since(c.aliasesTouchTime) >= 1*time.Hour
	aliasToSet := make(map[string]string)

	for _, featureSet := range setsResponseBody.FeatureSets {

		if _, exists := c.featureSetToData[featureSet]; !exists {
			c.featureSetToData[featureSet] = &FeatureData{
				cacheSignal: new(int32),
			}
		}

		// this is a table SCAN and aliases don't change often
		if updateAliases {
			log.Info("getting aliases for " + featureSet)

			aliasesURL := config.FeatureFlipperUri() + "/set/" + featureSet + "/aliases"
			log.Info("GET " + aliasesURL)
			if aliasesRes, err := http.Get(aliasesURL); err != nil {

				log.Error("GET", "URL", aliasesURL, "Error", err)
			} else {
				defer aliasesRes.Body.Close()
				if aliasesRes.StatusCode != 200 {
					log.Error("GET", "URL", aliasesURL, "StatusCode", aliasesRes.StatusCode)
					continue
				}

				fsa := FeatureSetAliases{}
				if err := json.NewDecoder(aliasesRes.Body).Decode(&fsa); err != nil {

					log.Error("json.Decode", "Error", err)
				} else {

					// use the feature set tokens to store features
					for _, alias := range fsa.Aliases {
						log.Debug("Alias", "alias", alias, "featureSet", featureSet)
						aliasToSet[alias] = featureSet
					}
				}
			}
		}
	}

	if updateAliases {
		c.aliasToSet = aliasToSet
		c.aliasesTouchTime = time.Now()
	}

	c.cacheTouchTime = time.Now()

	success = true
	return
}
