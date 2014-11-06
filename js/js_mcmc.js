/***
 * Sampler
 * Coded by Rasmus Bååth (C) 2012
 * Licensed under a Creative Commons Attribution-ShareAlike 3.0 Unported License
 * http://creativecommons.org/licenses/by-sa/3.0/deed.en_US
 */

// Constructor for the adaptive metropolis within Gibbs
function amwg(start_values, posterior, data_calc) {
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
        if(data_calc != null) {
            chain.push(curr_state.concat(data_calc(curr_state)))
        } else {
            chain.push(curr_state)
        }

        for(var param_i = 0; param_i < n_params; param_i++) {
            var param_prop = jStat.normal.sample(curr_state[param_i] , Math.exp( log_sd[param_i]) )
            var prop = curr_state.slice()
            prop[param_i] = param_prop
            try {
                var accept_prob = Math.exp(posterior(prop) - posterior(curr_state))
            } catch(err) { // Probably SD < 0 or similar...
                var accept_prob = 0
            }
            if(accept_prob > Math.random()) {
                acceptance_count[param_i]++
                curr_state = prop
            } // else do nothing
        }

        if(chain.length % batch_size == 0) {
            batch_count++
            for(var param_i = 0; param_i < n_params; param_i++) {
                if(acceptance_count[param_i] / batch_size > 0.44) {
                    log_sd[param_i] += Math.min(0.01, 1/Math.sqrt(batch_count))
                } else if(acceptance_count[param_i] / batch_size < 0.44) {
                    log_sd[param_i] -= Math.min(0.01, 1/Math.sqrt(batch_count))
                }
                acceptance_count[param_i] = 0 
            }
        }
        return curr_state
    }

    this.next_sample = next_sample

    this.get_chain = function() {return chain}
    this.get_curr_state = function() {return curr_state}

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

function dt_non_norm(x, mean, sd, df) {
    return 1 / sd * jStat.studentt.pdf( (x - mean) / sd, df)
}

function make_BEST_posterior_func(y1, y2) {
    data = [y1, y2]
    mean_mu = jStat.mean(y1.concat(y2))
    sd_mu = jStat.stdev(y1.concat(y2)) * 1000000
    sigma_low = jStat.stdev(y1.concat(y2)) / 1000
    sigma_high = jStat.stdev(y1.concat(y2)) * 1000


    var posterior = function(params) {
        var mu = [params[0], params[1]]
        var sigma = [params[2], params[3]]
        var nu = params[4]
        var log_p = 0
        log_p += Math.log(jStat.exponential.pdf( nu - 1, 1/29 ))
        for(var group = 0; group < 2; group++) {
            log_p += Math.log(jStat.uniform.pdf( sigma[group], sigma_low, sigma_high ))
            log_p += Math.log(jStat.normal.pdf( mu[group], mean_mu, sd_mu ))
            for(var subj_i = 0; subj_i < data[group].length; subj_i++) {
                log_p += Math.log(dt_non_norm(data[group][subj_i], mu[group], sigma[group], nu ))
            }
        }
        return log_p
    }

    return posterior
}

