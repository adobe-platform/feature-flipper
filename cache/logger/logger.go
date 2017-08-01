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
package logger

import (
	"io"
	"os"

	"github.com/adobe-platform/feature-flipper/constants"
	"gopkg.in/inconshreveable/log15.v2"
)

var rootLog = log15.New("service", "ff-cache")

func init() {

	logFmt := log15.LogfmtFormat()

	addStackTraceLogging(rootLog, os.Stdout, logFmt)
}

func New(kvps ...interface{}) log15.Logger {
	return rootLog.New(kvps...)
}

func addStackTraceLogging(log log15.Logger, writer io.Writer, logFmt log15.Format) {
	/*
		Log stack traces for LvlCrit, LvlError, and LvlWarn
		to help us debug issues in the wild

		const (
			LvlCrit Lvl = iota
			LvlError
			LvlWarn
			LvlInfo
			LvlDebug
		)
	*/
	stackHandler := log15.StreamHandler(writer, logFmt)
	stackHandler = log15.CallerStackHandler("%+v", stackHandler)
	// put filter last because it will be run first
	stackHandler = log15.FilterHandler(func(r *log15.Record) bool {
		return r.Lvl <= log15.LvlWarn
	}, stackHandler)

	infoHandler := log15.StreamHandler(writer, logFmt)
	if os.Getenv(constants.EnvLogDebug) == "" {
		infoHandler = log15.FilterHandler(func(r *log15.Record) bool {
			return r.Lvl == log15.LvlInfo
		}, infoHandler)
	} else {
		infoHandler = log15.FilterHandler(func(r *log15.Record) bool {
			return r.Lvl >= log15.LvlInfo
		}, infoHandler)
	}

	log.SetHandler(log15.MultiHandler(stackHandler, infoHandler))
}
