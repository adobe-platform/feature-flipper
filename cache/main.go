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
package main

import (
	"net/http"
	"time"

	"github.com/adobe-platform/feature-flipper/api"
	"github.com/adobe-platform/feature-flipper/config"
	"github.com/adobe-platform/feature-flipper/logger"
	"github.com/adobe-platform/feature-flipper/middleware"
)

func main() {
	http.DefaultClient = &http.Client{
		Timeout: middleware.ContextTimeout - (1 * time.Second),
	}

	log := logger.New()

	router := api.NewRouter()

	log.Info("feature flipper cache listing on port " + config.Port())
	if err := http.ListenAndServe(":"+config.Port(), router); err != nil {
		log.Crit("Failed to start service", "Error", err)
	}
}
