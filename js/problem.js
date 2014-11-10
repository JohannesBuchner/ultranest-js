
function dt_non_norm(x, mean, sd, df) {
    return 1 / sd * jStat.studentt.pdf( (x - mean) / sd, df)
}

function make_BEST_transform_func(y1, y2) {
    data = [y1, y2]
    mean_mu = jStat.mean(y1.concat(y2))
    sd_mu = jStat.stdev(y1.concat(y2)) * 1000
    sigma_low = jStat.stdev(y1.concat(y2)) / 1000
    sigma_high = jStat.stdev(y1.concat(y2)) * 1000
    rate = 1/29
    
    var transform = function(cube) {
        params = cube.slice()
        for(var group = 0; group < 2; group++) {
            params[group] = jStat.normal.inv(cube[group], mean_mu, sd_mu)
            params[2+group] = cube[2+group] * (sigma_high - sigma_low) + sigma_low
        }
        params[4] = jStat.exponential.inv(cube[4], rate) + 1
        for(var i = 0; i < params.length; i++) {
            if (isNaN(cube[i]) || isNaN(params[i])) alert("nan in transform[" + i + "]: " + cube[i] + " --> " + params[i])
        }
        return params
    }
    return transform
}

function make_BEST_likelihood_func(y1, y2) {
    data = [y1, y2]

    var likelihood = function(params) {
        var mu = [params[0], params[1]]
        var sigma = [params[2], params[3]]
        var nu = params[4]
        var log_p = 0
        for(var group = 0; group < 2; group++) {
            for(var subj_i = 0; subj_i < data[group].length; subj_i++) {
                log_p += Math.log(dt_non_norm(data[group][subj_i], mu[group], sigma[group], nu ))
            }
        }
        // alert("likelihood:" + params + " --> " + log_p)
        return log_p
    }

    return likelihood
}

