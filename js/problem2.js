
function make_BEST_transform_func(y1, y2) {
    var data = [y1, y2]
    var both = y1.concat(y2)
    var mean_mu = jStat.mean(both)
    var sd_mu = jStat.max(both) - jStat.min(both)
    var sigma_low = Math.log(sd_mu / 1000)
    var sigma_high = Math.log(sd_mu * 10)
    
    var transform = function(cube) {
        var params = cube.slice()
        for(var group = 0; group < 2; group++) {
            params[group] = jStat.normal.inv(cube[group], mean_mu, sd_mu)
            params[2+group] = Math.pow(10, cube[2+group] * (sigma_high - sigma_low) + sigma_low)
        }
        for(var i = 0; i < params.length; i++) {
            if (isNaN(cube[i]) || isNaN(params[i])) alert("nan in transform[" + i + "]: " + cube[i] + " --> " + params[i])
        }
        return params
    }
    return transform
}

function make_BEST_likelihood_func(y1, y2) {
    var data = [y1, y2]

    var likelihood = function(params) {
        var mu = [params[0], params[1]]
        var sigma = [params[2], params[3]]
        var log_p = 0
        for(var group = 0; group < 2; group++) {
            for(var subj_i = 0; subj_i < data[group].length; subj_i++) {
                log_p += Math.log(jStat.normal.pdf(data[group][subj_i], mu[group], sigma[group]))
            }
        }
        // console.log("likelihood:" + params + " --> " + log_p)
        if (!isFinite(log_p))
        	return -1e300
        return log_p
    }

    return likelihood
}


function make_BEST_single_transform_func(y1, y2) {
    var data = y1.concat(y2)
    var both = data
    var mean_mu = jStat.mean(both)
    var sd_mu = jStat.max(both) - jStat.min(both)
    var sigma_low = Math.log(sd_mu / 1000)
    var sigma_high = Math.log(sd_mu * 10)
    
    var transform = function(cube) {
        var params = cube.slice()
        params[0] = jStat.normal.inv(cube[0], mean_mu, sd_mu)
        params[1] = Math.pow(10, cube[1] * (sigma_high - sigma_low) + sigma_low)
        for(var i = 0; i < params.length; i++) {
            if (isNaN(cube[i]) || isNaN(params[i])) alert("nan in transform[" + i + "]: " + cube[i] + " --> " + params[i])
        }
        return params
    }
    return transform
}

function make_BEST_single_likelihood_func(y1, y2) {
    var data = y1.concat(y2)

    var likelihood = function(params) {
        var mu = params[0]
        var sigma = params[1]
        var log_p = 0
        for(var subj_i = 0; subj_i < data.length; subj_i++) {
            log_p += Math.log(jStat.normal.pdf(data[subj_i], mu, sigma))
        }
        if (!isFinite(log_p))
        	return -1e300
        return log_p
    }

    return likelihood
}

