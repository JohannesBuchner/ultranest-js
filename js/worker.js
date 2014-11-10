/***
 * Web worker
 * Coded by Johannes Buchner (C) 2014
 * Licensed under AGPLv3
 */

importScripts('jstat.js', 'problem2.js', 'js_nested2.js');

// var y1 = [1.96, 2.06, 2.03, 2.11, 1.88, 1.88, 2.08, 1.93, 2.03, 2.03, 2.03, 2.08, 2.03, 2.11, 1.93]
// var y2 = [1.83, 1.93, 1.88, 1.85, 1.85, 1.91, 1.91, 1.85, 1.78, 1.91, 1.93, 1.80, 1.80, 1.85, 1.93, 1.85, 1.83, 1.85, 1.91, 1.85, 1.91, 1.85, 1.80, 1.80, 1.85]

function run_nested(ndim, transform, likelihood) {
	integrator = new integrator(ndim, transform, likelihood, null, 400, 0.5, 10000)
	var i = 0
	var r = integrator.progress()
	while (r != 0) {
		i = i + 1
		if (i % 50 == 0)
			postMessage(["progress", i])
		if (i > 10000)
			break
		r = integrator.progress()
	}
	var results = integrator.getResults()
	postMessage(["done", results]);
}

onmessage = function (oEvent) {
	if (oEvent.data[0] == "4") {
		var y1 = oEvent.data[1]
		var y2 = oEvent.data[2]
	  	var transform = make_BEST_transform_func(y1, y2)
		var likelihood = make_BEST_likelihood_func(y1, y2)
		run_nested(4, transform, likelihood)
	} else if (oEvent.data[0] == "2") {
		var y1 = oEvent.data[1]
		var y2 = oEvent.data[2]
	  	var transform = make_BEST_single_transform_func(y1, y2)
		var likelihood = make_BEST_single_likelihood_func(y1, y2)
		run_nested(2, transform, likelihood)
	}
};


