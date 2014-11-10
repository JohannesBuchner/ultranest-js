/***
 * Sampler
 * Coded by Rasmus Bååth (C) 2012
 * Licensed under a Creative Commons Attribution-ShareAlike 3.0 Unported License
 * http://creativecommons.org/licenses/by-sa/3.0/deed.en_US
 */

// Constructor for the adaptive metropolis within Gibbs
function amwg(start_values, transform, likelihood, data_calc) {
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

    this.burn = function(n) {
        var temp_chain = chain.slice()
        this.n_samples(n)
        chain = temp_chain
    }

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

