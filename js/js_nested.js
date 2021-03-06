/***
 * Sampler
 * Coded by Johannes Buchner (C) 2014
 * Licensed under AGPLv3
 */

function point(L, coords, phys_coords) {
	this.L = L
	this.coords = coords
	this.phys_coords = phys_coords
}
function random_uniform() {
	return Math.random()
}
function random_normal(mu, stdev) {
	return jStat.normal.sample(mu, stdev)
}
function random_int(imin, imax) {
    return Math.floor(Math.random() * (imax - imin + 1)) + imin;
}
function logaddexp(a, b) {
	if (b > a)
		return Math.log(1 + Math.exp(a - b)) + b
	else
		return Math.log(1 + Math.exp(b - a)) + a
}

function compute_distance(acoords, bcoords) {
	var distsq = 0
	for(var j = 0; j < acoords.length; j++)
		distsq += (acoords[j] - bcoords[j]) * (acoords[j] - bcoords[j])
	return Math.sqrt(distsq)
}

function compute_distance_lt(acoords, bcoords, maxsqdistance) {
	var distsq = 0
	for(var j = 0; j < acoords.length; j++) {
		distsq += (acoords[j] - bcoords[j]) * (acoords[j] - bcoords[j])
		if (distsq > maxsqdistance)
			return false
	}
	return true
}

function nearest_rdistance_guess(ndim, live_points) {
	var maxdistance = 0.0;
	for(var i = 0; i < live_points.length; i++) {
		// leave ith point out
		var mindistance = 1e300
		var nonmember = live_points[i]
		for (var k = 0; k < live_points.length; k++) {
			if (k == i)
				continue;
			var dist = compute_distance(live_points[k].coords, nonmember.coords)
			if (k == 0 || dist < mindistance)
				mindistance = dist
		}
		maxdistance = Math.max(mindistance, maxdistance)
	}
	// console.log("nearest_rdistance_guess: " + maxdistance + " from " + live_points.length)
	return maxdistance
}
function random_normal_vector(ndim) {
	var direction = []
	var lengthsq = 0
	for (var j = 0; j < ndim; j++) {
		direction[j] = jStat.normal.sample(0, 1)
		lengthsq += Math.pow(direction[j], 2)
	}
	var length = Math.sqrt(lengthsq)
	for (var j = 0; j < ndim; j++) {
		direction[j] = direction[j] / length
	}
	return direction
}

function radfriends_drawer(ndim, transform, likelihood) {
	this.likelihood = likelihood,
	this.transform = transform
	this.ndim = ndim
	var niter = 0
	this.niter = niter
	function _init_region() {
		region_low = []
		region_high = []
	
		for (var i = 0; i < ndim; i++) {
			region_low[i] = 0.0
			region_high[i] = 1.0
		}
		this.region_low = region_low
		this.region_high = region_high
	}
	this.init_region = _init_region
	var _maxdistance = NaN
	this.maxdistance = _maxdistance
	var phase = 0
	this.phase = phase
	this.init_region()
	
	function _is_inside(current, members) {
		for (var i = 0; i < ndim; i++) {
			if (current.coords[i] < this.region_low[i])
				return false
			if (current.coords[i] > this.region_high[i])
				return false
		}
		if (!(this.maxdistance > 0)) {
			console.log("friends not used because maxdistance is " + this.maxdistance)
			return true;
		}
		for (var i = 0; i < members.length; i++) {
			var dist = compute_distance(members[i].coords, current.coords)
			if (dist <= this.maxdistance) {
				return true
			}
		}
		return false
	}
	this.is_inside = _is_inside
	function _count_inside(current, members) {
		for (var i = 0; i < ndim; i++) {
			if (current.coords[i] < this.region_low[i])
				return 0
			if (current.coords[i] > this.region_high[i])
				return 0
		}
		if (!(this.maxdistance > 0)) {
			console.log("friends not used because maxdistance is " + this.maxdistance)
			return 1;
		}
		var nnearby = 0
		//console.log("neighbors of " + current.coords)
		for (var i = 0; i < members.length; i++) {
			var dist = compute_distance(members[i].coords, current.coords)
			if (dist <= this.maxdistance) {
				//console.log("distance " + dist + " (max:" + this.maxdistance  + ") to [" + i + "]: " + members[i].coords)
				nnearby += 1;
			}
		}
		return nnearby
	}
	this.count_inside = _count_inside
	function _generate_direct(current, members) {
		var ntotal = 0
		while(1) {
			for(var j = 0; j < ndim; j++) {
				current.coords[j] = random_uniform() * (this.region_high[j] - this.region_low[j]) + this.region_low[j]
				current.phys_coords[j] = current.coords[j]
			}
			ntotal += 1
			if (members.length == 0) {
				console.log("generate_direct(): No friends available for checking!")
				return ntotal
			}
			if (this.is_inside(current, members))
				return ntotal
			if (ntotal > 1000)
				return ntotal
		}
	}
	this.generate_direct = _generate_direct
	
	function _generate_from_friends(current, members) {
		var ntotal = 0
		while(1) {
			ntotal += 1
			member = members[random_int(0, members.length - 1)]
			var direction = random_normal_vector(ndim)
			var radius = this.maxdistance * Math.pow(random_uniform(), 1.0/ndim)
			for(var j = 0; j < ndim; j++) {
				current.coords[j] = member.coords[j] + direction[j] * radius
				current.phys_coords[j] = current.coords[j]
			}
			ntotal += 1
			if (this.is_inside(current, members)) {
				var coin = random_uniform()
				var nnearby = this.count_inside(current, members)
				if (coin < 1.0 / nnearby)
					return ntotal
			}
		}
	}
	this.generate_from_friends = _generate_from_friends
	
	
	function _next(current, live_points) {
		this.niter += 1
		var Lmin = current.L
		// console.log("drawer: next() iteration " + this.niter + " - " + Lmin)
		if (!(this.maxdistance > 0) || (this.niter % 20 == 1)) {
			// console.log("drawer: next(): recomputing maxdistance")
			var newmaxdistance = nearest_rdistance_guess(ndim, live_points)
			if (!(this.maxdistance > 0) || newmaxdistance < this.maxdistance)
				this.maxdistance = newmaxdistance
			for (var j = 0; j < ndim; j++) {
				var low = 1
				var high = 0
				for (var i = 0; i < live_points.length; i++) {
					var p = live_points[i]
					low = Math.min(low, p.coords[j])
					high = Math.max(high, p.coords[j])
				}
				this.region_low[j] = Math.max(0, low - this.maxdistance)
				this.region_high[j] = Math.min(1, high + this.maxdistance)
			}
			console.log("drawer: next(): new maxdistance: " + this.maxdistance)
		}
		var ntoaccept = 0
		if (this.phase == 0) {
			//console.log("drawer: next(): generating from rectangle")
			while (1) {
				var ntotal = this.generate_direct(current, live_points)
				ntoaccept += 1
				current.phys_coords = transform(current.coords)
				current.L = likelihood(current.phys_coords)
				if (current.L >= Lmin) {
					if (this.iter % 100 == 1)
						console.log("drawer: next()[rectangle]: accepted: " + current.L + " after " + ntoaccept + " evals (" + ntotal + ")" )
					return current
				}
				if (ntotal >= 20) {
					this.phase = 1
					break
				}
			}
		}
		//console.log("drawer: next(): generating from friends")
		while (1) {
			ntoaccept += 1
			var ntotal = this.generate_from_friends(current, live_points)
			current.phys_coords = transform(current.coords)
			current.L = likelihood(current.phys_coords)
			if (current.L >= Lmin) {
				if (this.iter % 100 == 1)
					console.log("drawer: next()[friends]: accepted: " + current.L + " after " + ntoaccept + " evals (" + ntotal + ")")
				return current
			}
		}
	}
	this.next = _next
	
}

function generate_fullspace(ndim) {
	var current = new point(1e300, [], []) 
	for(j = 0; j < ndim; j++) {
		current.coords[j] = random_uniform()
		current.phys_coords[j] = current.coords[j]
	}
	return current
}

function sort_L(live_points) {
	// console.log("live points before sort: " + live_points[0].L + " to " + live_points[live_points.length - 1].L)
	live_points.sort(function(a, b) {
		if (a.L < b.L)
			return -1
		if (a.L > b.L)
			return 1
		return 0
	})
	// console.log("live points after  sort: " + live_points[0].L + " to " + live_points[live_points.length - 1].L)
}

function nested_sampler(ndim, drawer, nlive_points, transform, likelihood) {
	this.nlive_points = nlive_points
	this.transform = transform
	this.likelihood = likelihood
	this.ndim = ndim
	this.Lmax = NaN
	this.remainderZ = NaN
	this.ndraws = 0
	this.drawer = drawer
	this.live_points = []
	function _generate_live_points() {
		console.log("sampler: generating live points ")
		for(var i = 0; i < nlive_points; i++) {
			var Lmin = -1e300
			var current = generate_fullspace(ndim)
			current.phys_coords = transform(current.coords)
			current.L = likelihood(current.phys_coords)
			if (i == 0)
				this.Lmax = current.L
			else
				this.Lmax = Math.max(this.Lmax, current.L)
			this.live_points[i] = current
		}
		sort_L(this.live_points)
		console.log("sampler: generating live points done: " + this.live_points.length)
	}
	this.generate_live_points = _generate_live_points
	this.generate_live_points()
	
	function _next() {
		var i = 0
		var lowest = this.live_points[i]
		//console.log("sampler: next(): need better than " + lowest.L)
		var replacement = new point(lowest.L, lowest.coords.slice(), lowest.phys_coords.slice())
		var ndraws = drawer.next(replacement, this.live_points)
		//console.log("sampler: next(): got " + replacement.L + ", returning " + lowest.L)
		this.live_points[i] = replacement
		sort_L(this.live_points)
		this.ndraws += ndraws
		return lowest
	}
	this.next = _next
	function _integrate_remainder(logwidth, logVolremaining, logZ, points) {
		//console.log("sampler: integrate_remainder()")
		var n = nlive_points
		var logV = logwidth
		var L0 = this.live_points[this.live_points.length - 1].L
		var Lmax = 0
		var Lmin = 0
		var Lmid = 0
		for (var i = 0; i < n; i++) {
			var Ldiff = Math.exp(this.live_points[i].L - L0)
			if (i > 0)
				Lmax += Ldiff
			if (i == n - 1)
				Lmax += Ldiff
			if (i < n - 1)
				Lmin += Ldiff
			if (i == 0)
				Lmin += Ldiff
			Lmid += Ldiff
		}
		var logZmid = logaddexp(logZ, logV + Math.log(Lmid) + L0)
		var logZup  = logaddexp(logZ, logV + Math.log(Lmax) + L0)
		var logZlo  = logaddexp(logZ, logV + Math.log(Lmin) + L0)
		var logZerr = Math.max(logZup - logZmid, logZmid - logZlo)
		this.remainderZ = logV + Math.log(Lmid) + L0
		this.remainderZerr = logZerr
		var points = []
		for (var i = 0; i < n; i++) {
			points[i] = [logwidth, this.live_points[i]]
		}
		return points
	}
	this.integrate_remainder = _integrate_remainder
}

function posterior_samples(weighted_samples, nsamples) {
	var probs = []
	var logmax = weighted_samples[0][0] + weighted_samples[0][1].L
	console.log("wsamples: " + weighted_samples[0] + " -> " + weighted_samples[0][1] + " -> " + weighted_samples[0][1].L)
	for (var i = 0; i < weighted_samples.length; i++) {
		logmax = Math.max(logmax, weighted_samples[i][0] + weighted_samples[i][1].L)
	}
	console.log("logmax:" + logmax)
	var sum = 0
	for (var i = 0; i < weighted_samples.length; i++) {
		probs[i] = Math.exp(weighted_samples[i][0] + weighted_samples[i][1].L - logmax)
		sum += probs[i]
	}
	console.log("sum:" + sum)
	var samples = []
	for (var j = 0; j < nsamples; j++) {
		var coin = random_uniform() * sum
		var below = 0
		var i = 0
		while(i < weighted_samples.length) {
			below += probs[i]
			if (coin <= below)
				break
			else
				i += 1
		}
		// console.log("choice:" + i + " of " + weighted_samples.length + " where " + coin + " reached " + below)
		samples[j] = weighted_samples[i][1].phys_coords
	}
	console.log("means:", jStat(samples).mean())
	console.log("stdev:", jStat(samples).stdev())
	return samples
}

function integrator(ndim, transform, likelihood, data_calc, nlive_points, tolerance, maxiter) {
	var drawer = new radfriends_drawer(ndim, transform, likelihood)
	var sampler = new nested_sampler(ndim, drawer, nlive_points, transform, likelihood)
	this.current = sampler.next()
	
	this.logVolremaining = 0
	this.logwidth = Math.log(1 - Math.exp(-1.0 / nlive_points))
	
	this.iter = 0
	var weights = []
	this.weights = weights
	this.results = []
	this.wi = this.logwidth + this.current.L
	this.logZ = this.wi
	this.H = this.current.L - this.logZ
	this.logZerr = NaN
	console.log("integrator[initial]: ln Z = " + this.logZ + " " + this.H + " " + this.wi + " " + this.current.L)
	
	function _progress() {
		this.logwidth = Math.log(1 - Math.exp(-1.0 / nlive_points)) + this.logVolremaining
		this.logVolremaining -= 1.0 / nlive_points
		
		weights[this.iter] = [this.logwidth, this.current]
		
		this.iter += 1
		this.logZerr = Math.sqrt(this.H / nlive_points)
		
		sampler.integrate_remainder(this.logwidth, this.logVolremaining, this.logZ)
		
		if (this.iter > nlive_points) {
			var total_error = this.logZerr + sampler.remainderZerr
			if (total_error < tolerance) {
				console.log("integrator: tolerance reached " + total_error + " of " + tolerance)
				return 0
			}
			if (sampler.remainderZerr < this.logZerr / 10.) {
				console.log("integrator: tolerance can not be reached " + sampler.remainderZerr + " vs " + this.logZerr / 10.)
				return 0
			}
			if (maxiter > 0 && this.iter > maxiter) {
				console.log("integrator: max # of iter reached")
				return 0
			}
		}
		this.current = sampler.next()
		this.wi = this.logwidth + this.current.L
		var logZnew = logaddexp(this.logZ, this.wi)
		this.H = Math.exp(this.wi - logZnew) * this.current.L + Math.exp(this.logZ - logZnew) * (this.H + this.logZ) - logZnew
		this.logZ = logZnew
		if (this.iter % 50 == 0)
			console.log("integrator[" + this.iter + "]: current ln Z = " + this.logZ + " +- " + this.logZerr + " +- " + sampler.remainderZerr)
		return 1
	}
	this.progress = _progress
	function _getResults() {
		remainder_weights = sampler.integrate_remainder(this.logwidth, this.logVolremaining, this.logZ)
		var logZerrfinal = this.logZerr + sampler.remainderZerr
		var logZfinal = logaddexp(this.logZ, sampler.remainderZ)

		return [logZfinal, logZerrfinal, weights.concat(remainder_weights)]
	}
	this.getResults = _getResults
	this.onComplete = null
	function _onCompleteInternal() {
		var remainder_weights = sampler.integrate_remainder(this.logwidth, this.logVolremaining, this.logZ)
		var logZerr = this.logZerr + sampler.remainderZerr
		var logZ = logaddexp(this.logZ, sampler.remainderZ)

		this.onComplete(logZ, logZerr, weights.concat(remainder_weights))
	}
	this.onCompleteInternal = _onCompleteInternal
	function _next1() {
		console.log("integrator: next1(): iteration " + this.iter)
		var r = this.progress()
		if (r == 1)
			return this.next1()
		else
			this.onCompleteInternal()
	}
	this.next1 = _next1
	
	function _run(onComplete) {
		this.onComplete = onComplete;
		this.next1()
	}
	this.run = _run
	function _runInline(onComplete) {
		this.onComplete = onComplete;
		while (this.progress() != 0) {
		}
		this.onCompleteInternal()
		this.onComplete()
	}
	this.runInline = _runInline

}

// Constructor for nested sampling
function nested(start_values, transform, likelihood, data_calc) {
    var n_params = start_values.length
    var batch_count = 0
    var batch_size = 50
    var chain = []
    var curr_state = start_values
    var log_sd = []
    this.log_sd = log_sd
    var acceptance_count = []
    var running_asynch = false
    for (var i = 0; i < n_params; i++) {
        log_sd[i] = 0
        acceptance_count[i] = 0 
    }

    function next_sample() {
        curr_state_t = transform(curr_state)
        if(data_calc != null) {
            chain.push(curr_state_t.concat(data_calc(curr_state_t)))
        } else {
            chain.push(curr_state_t)
        }

        for(var param_i = 0; param_i < n_params; param_i++) {
            var param_prop = jStat.normal.sample(curr_state[param_i] , Math.exp( log_sd[param_i]) )
            // normalize
            if (param_prop < 1e-9)
                param_prop = 1e-9
            if (param_prop > 1 - 1e-9)
                param_prop = 1 - 1e-9
            if (isNaN(param_prop))
                alert(param_prop)
            var prop = curr_state.slice()
            prop[param_i] = param_prop
            try {
                var accept_prob = Math.exp(likelihood(transform(prop)) - likelihood(curr_state_t))
            } catch(err) { // Probably SD < 0 or similar...
                var accept_prob = 0
            }
            if(accept_prob > Math.random()) {
                //if (param_i == 0)
                //    alert("accept " + param_i + ": " + curr_state_t + " --> " + transform(prop))
                acceptance_count[param_i]++
                curr_state = prop
            } // else do nothing
        }

        if(chain.length % batch_size == 0) {
            batch_count++
            for(var param_i = 0; param_i < n_params; param_i++) {
                if(acceptance_count[param_i] / batch_size > 0.44) {
                    log_sd[param_i] += Math.min(0.01, 1/Math.sqrt(batch_count))
                    //if (param_i == 0)
                    //  alert("new acceptance rate for " + param_i + ": " + log_sd[param_i] + " | AR:" + acceptance_count[param_i] / batch_size)
                } else if(acceptance_count[param_i] / batch_size < 0.44) {
                    log_sd[param_i] -= Math.min(0.01, 1/Math.sqrt(batch_count))
                    //if (param_i == 0)
                    //  alert("new acceptance rate for " + param_i + ": " + log_sd[param_i] + " | AR:" + acceptance_count[param_i] / batch_size)
                }
                acceptance_count[param_i] = 0 
            }
        }
        return curr_state
    }

    this.next_sample = next_sample

    this.get_chain = function() {return chain}
    this.get_curr_state = function() {return transform(curr_state)}

    function n_samples(n) {
        for(var i = 0; i < n - 1; i++) {
            next_sample()
        }
        return next_sample()
    }

    this.n_samples = n_samples

    this.is_running_asynch = function() {return running_asynch}

    function n_samples_asynch(n, nbr_of_samples) {
        if(n > 0) {
            running_asynch = true
            n_samples(nbr_of_samples)
            return setTimeout(function() {n_samples_asynch(n - nbr_of_samples, nbr_of_samples)}, 0)
        } else {
            running_asynch = false
        }
    }

    this.n_samples_asynch = n_samples_asynch
}

