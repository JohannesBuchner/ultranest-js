/***
 * Web worker
 * Coded by Johannes Buchner (C) 2014-2018
 * Licensed under AGPLv3
 */

importScripts('jstat.js', 'js_nested2.js');

function make_transform_func(data) {
    var transform = function(cube) {
        var params = cube.slice()
        for(var i = 0; i < params.length; i++) {
            if (isNaN(cube[i]) || isNaN(params[i])) alert("nan in transform[" + i + "]: " + cube[i] + " --> " + params[i])
        }
        // mean mu
        params[0] = cube[0]*100 - 50;
        // std sigma
        params[1] = Math.pow(10, cube[1]*4 - 2);
        return params
    }
    return transform
}

function make_likelihood_func(data) {

    var likelihood = function(params) {
        var mu = params[0];
        var sigma = params[1];
        var log_p = 0;
        for(var i = 0; i < data.length; i++) {
            var pavg = 0;
	    for(var j = 0; j < data[i].length; j++) {
                var p = jStat.normal.pdf(data[i][j], mu, sigma);
                pavg += p;
            }
            log_p += Math.log(pavg / data[i].length + 1e-100);
        }
        //console.log("likelihood:" + params + " --> " + log_p)
        if (!isFinite(log_p))
        	return -1e300
        return log_p
    }

    return likelihood
}


function run_nested(ndim, transform, likelihood) {
	integrator = new integrator(ndim, transform, likelihood, null, 2000, 0.5, 10000)
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
	var data = oEvent.data[1]
  	var transform = make_transform_func(data)
	var likelihood = make_likelihood_func(data)
	run_nested(2, transform, likelihood)
};


