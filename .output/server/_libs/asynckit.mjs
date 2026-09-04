import { t as __commonJSMin } from "../_runtime.mjs";
import processModule from "node:process";
import { setImmediate } from "node:timers";
//#region node_modules/asynckit/lib/defer.js
var require_defer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = defer;
	/**
	* Runs provided function on next iteration of the event loop
	*
	* @param {function} fn - function to run
	*/
	function defer(fn) {
		var nextTick = typeof setImmediate == "function" ? setImmediate : typeof processModule == "object" && typeof processModule.nextTick == "function" ? processModule.nextTick : null;
		if (nextTick) nextTick(fn);
		else setTimeout(fn, 0);
	}
}));
//#endregion
//#region node_modules/asynckit/lib/async.js
var require_async = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var defer = require_defer();
	module.exports = async;
	/**
	* Runs provided callback asynchronously
	* even if callback itself is not
	*
	* @param   {function} callback - callback to invoke
	* @returns {function} - augmented callback
	*/
	function async(callback) {
		var isAsync = false;
		defer(function() {
			isAsync = true;
		});
		return function async_callback(err, result) {
			if (isAsync) callback(err, result);
			else defer(function nextTick_callback() {
				callback(err, result);
			});
		};
	}
}));
//#endregion
//#region node_modules/asynckit/lib/abort.js
var require_abort = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = abort;
	/**
	* Aborts leftover active jobs
	*
	* @param {object} state - current state object
	*/
	function abort(state) {
		Object.keys(state.jobs).forEach(clean.bind(state));
		state.jobs = {};
	}
	/**
	* Cleans up leftover job by invoking abort function for the provided job id
	*
	* @this  state
	* @param {string|number} key - job id to abort
	*/
	function clean(key) {
		if (typeof this.jobs[key] == "function") this.jobs[key]();
	}
}));
//#endregion
//#region node_modules/asynckit/lib/iterate.js
var require_iterate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var async = require_async();
	var abort = require_abort();
	module.exports = iterate;
	/**
	* Iterates over each job object
	*
	* @param {array|object} list - array or object (named list) to iterate over
	* @param {function} iterator - iterator to run
	* @param {object} state - current job status
	* @param {function} callback - invoked when all elements processed
	*/
	function iterate(list, iterator, state, callback) {
		var key = state["keyedList"] ? state["keyedList"][state.index] : state.index;
		state.jobs[key] = runJob(iterator, key, list[key], function(error, output) {
			if (!(key in state.jobs)) return;
			delete state.jobs[key];
			if (error) abort(state);
			else state.results[key] = output;
			callback(error, state.results);
		});
	}
	/**
	* Runs iterator over provided job element
	*
	* @param   {function} iterator - iterator to invoke
	* @param   {string|number} key - key/index of the element in the list of jobs
	* @param   {mixed} item - job description
	* @param   {function} callback - invoked after iterator is done with the job
	* @returns {function|mixed} - job abort function or something else
	*/
	function runJob(iterator, key, item, callback) {
		var aborter;
		if (iterator.length == 2) aborter = iterator(item, async(callback));
		else aborter = iterator(item, key, async(callback));
		return aborter;
	}
}));
//#endregion
//#region node_modules/asynckit/lib/state.js
var require_state = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = state;
	/**
	* Creates initial state object
	* for iteration over list
	*
	* @param   {array|object} list - list to iterate over
	* @param   {function|null} sortMethod - function to use for keys sort,
	*                                     or `null` to keep them as is
	* @returns {object} - initial state object
	*/
	function state(list, sortMethod) {
		var isNamedList = !Array.isArray(list), initState = {
			index: 0,
			keyedList: isNamedList || sortMethod ? Object.keys(list) : null,
			jobs: {},
			results: isNamedList ? {} : [],
			size: isNamedList ? Object.keys(list).length : list.length
		};
		if (sortMethod) initState.keyedList.sort(isNamedList ? sortMethod : function(a, b) {
			return sortMethod(list[a], list[b]);
		});
		return initState;
	}
}));
//#endregion
//#region node_modules/asynckit/lib/terminator.js
var require_terminator = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var abort = require_abort();
	var async = require_async();
	module.exports = terminator;
	/**
	* Terminates jobs in the attached state context
	*
	* @this  AsyncKitState#
	* @param {function} callback - final callback to invoke after termination
	*/
	function terminator(callback) {
		if (!Object.keys(this.jobs).length) return;
		this.index = this.size;
		abort(this);
		async(callback)(null, this.results);
	}
}));
//#endregion
//#region node_modules/asynckit/parallel.js
var require_parallel = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var iterate = require_iterate();
	var initState = require_state();
	var terminator = require_terminator();
	module.exports = parallel;
	/**
	* Runs iterator over provided array elements in parallel
	*
	* @param   {array|object} list - array or object (named list) to iterate over
	* @param   {function} iterator - iterator to run
	* @param   {function} callback - invoked when all elements processed
	* @returns {function} - jobs terminator
	*/
	function parallel(list, iterator, callback) {
		var state = initState(list);
		while (state.index < (state["keyedList"] || list).length) {
			iterate(list, iterator, state, function(error, result) {
				if (error) {
					callback(error, result);
					return;
				}
				if (Object.keys(state.jobs).length === 0) {
					callback(null, state.results);
					return;
				}
			});
			state.index++;
		}
		return terminator.bind(state, callback);
	}
}));
//#endregion
//#region node_modules/asynckit/serialOrdered.js
var require_serialOrdered = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var iterate = require_iterate();
	var initState = require_state();
	var terminator = require_terminator();
	module.exports = serialOrdered;
	module.exports.ascending = ascending;
	module.exports.descending = descending;
	/**
	* Runs iterator over provided sorted array elements in series
	*
	* @param   {array|object} list - array or object (named list) to iterate over
	* @param   {function} iterator - iterator to run
	* @param   {function} sortMethod - custom sort function
	* @param   {function} callback - invoked when all elements processed
	* @returns {function} - jobs terminator
	*/
	function serialOrdered(list, iterator, sortMethod, callback) {
		var state = initState(list, sortMethod);
		iterate(list, iterator, state, function iteratorHandler(error, result) {
			if (error) {
				callback(error, result);
				return;
			}
			state.index++;
			if (state.index < (state["keyedList"] || list).length) {
				iterate(list, iterator, state, iteratorHandler);
				return;
			}
			callback(null, state.results);
		});
		return terminator.bind(state, callback);
	}
	/**
	* sort helper to sort array elements in ascending order
	*
	* @param   {mixed} a - an item to compare
	* @param   {mixed} b - an item to compare
	* @returns {number} - comparison result
	*/
	function ascending(a, b) {
		return a < b ? -1 : a > b ? 1 : 0;
	}
	/**
	* sort helper to sort array elements in descending order
	*
	* @param   {mixed} a - an item to compare
	* @param   {mixed} b - an item to compare
	* @returns {number} - comparison result
	*/
	function descending(a, b) {
		return -1 * ascending(a, b);
	}
}));
//#endregion
//#region node_modules/asynckit/serial.js
var require_serial = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var serialOrdered = require_serialOrdered();
	module.exports = serial;
	/**
	* Runs iterator over provided array elements in series
	*
	* @param   {array|object} list - array or object (named list) to iterate over
	* @param   {function} iterator - iterator to run
	* @param   {function} callback - invoked when all elements processed
	* @returns {function} - jobs terminator
	*/
	function serial(list, iterator, callback) {
		return serialOrdered(list, iterator, null, callback);
	}
}));
//#endregion
//#region node_modules/asynckit/index.js
var require_asynckit = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		parallel: require_parallel(),
		serial: require_serial(),
		serialOrdered: require_serialOrdered()
	};
}));
//#endregion
export { require_asynckit as t };
