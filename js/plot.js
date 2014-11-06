/***
 * Plotting
 * Coded by Rasmus Bååth (C) 2012
 * Licensed under a Creative Commons Attribution-ShareAlike 3.0 Unported License
 * http://creativecommons.org/licenses/by-sa/3.0/deed.en_US
 */

/* and this function is also in here, for data parsing */
function string_to_num_array(s) {
    s = s.replace(/[^-1234567890.]+$/, '').replace(/^[^-1234567890.]+/, '')
    return jStat.map(s.split(/[^-1234567890.]+/), function(x) {return parseFloat(x)})
}


function histogram_counts(x, breaks) {
    var min = jStat.min(x)
    var max = jStat.max(x)
    var bins = []
    for(var i =0; i < breaks; i++) {bins.push([min + i/(breaks) * (max - min) + (max - min) / breaks / 2, 0])}
    for(var i = 0; i < x.length; i++) {
        bin_i = Math.floor((x[i] - min) / (max - min) * breaks)
        if(bin_i > breaks - 1) {bin_i = breaks - 1}
        if(bin_i < 0) {bin_i = 0}
        bins[bin_i][1]++
    }
    return bins
}

function HDIofMCMC(x) {
    x = x.sort(function(a,b){return a-b})
    var ci_nbr_of_points = Math.floor(x.length * 0.95)
    var min_width_ci = [jStat.min(x), jStat.max(x)] // just initializing
    for(var i = 0; i < x.length - ci_nbr_of_points; i++) {
        var ci_width = x[i + ci_nbr_of_points] - x[i]
        if(ci_width < min_width_ci[1] - min_width_ci[0]) {
            min_width_ci = [x[i], x[i + ci_nbr_of_points]]
        }
    }
    return min_width_ci
}

function perc_larger_and_smaller_than(comp, data) {
    comps = jStat.map( data, function( x ) {
        if(x >= comp) {
            return 1
        } else {
            return 0
        }
    })
    mean_larger = jStat.mean(comps)
    return [1 - mean_larger, mean_larger]
}

/* public plot functions */ 

function chain_to_plot_data(chain, step_size, samples_to_keep) {
    if(samples_to_keep != null) {
        step_size = chain.length / samples_to_keep
    } 
    plot_data = []
    for(var i = 0; i < chain[0].length; i++) {
        plot_data.push([])
    }
    for(var i = 0; i < chain.length; i += step_size) {
        var sample_i = Math.floor(i)
        var sample = chain[sample_i]
        for(var param_i = 0; param_i < sample.length; param_i++) {
            plot_data[param_i].push([sample_i, sample[param_i]])
        }
    }
    return plot_data
}

function param_chain(chain, param_i) {
    // get column param_i
    var param_data = []
    for (var i = 0; i < chain.length; i++) {
        param_data.push(chain[i][param_i])
    }
    return param_data
}
function plot_mcmc_chain(div_id, plot_data, title) {
    $.plot($("#" + div_id), [{data: plot_data, label: title}], {shadowSize: 0})
}

function plot_mcmc_hist(div_id, param_data, show_hdi, comp_value, xlim) {
    var bar_data = histogram_counts(param_data, 30)
    var bar_width = bar_data[1][0] - bar_data[0][0]

    var mean = jStat.mean(param_data)
    var mean_data = [[mean, 0]]
    var mean_label = "Mean: " + mean.toPrecision(3)
    if(show_hdi) {
        var hdi = HDIofMCMC(param_data)
        var hdi_data = [[hdi[0], 0], [hdi[1], 0]]
        var hdi_label = "95% HDI ("+ hdi[0].toPrecision(3) + ", " + hdi[1].toPrecision(3) +")"
    }

    if(comp_value != null) {
        var comp_data = [[comp_value, 0], [comp_value, Infinity]]
        var comp_perc = perc_larger_and_smaller_than(comp_value, param_data)
        var comp_label = "" + (comp_perc[0] * 100).toPrecision(3) + "% < " + comp_value + " < " + (comp_perc[1] * 100).toPrecision(3) + "%"

    }
    var plot_options = {font: {size: 9}, shadowSize: 0, yaxis: {autoscaleMargin:0.66}}

    if(xlim != null) {
        plot_options["xaxis"] = {min: xlim[0], max: xlim[1]}
    }
    if(show_hdi && comp_value == null) {
        $.plot($("#" + div_id), [{data: bar_data, bars: {show: true, align: "center", barWidth: bar_width}},[] , {data: hdi_data, label: hdi_label, lines: {lineWidth: 5}}, {data: mean_data, label: mean_label, points: { show: true }}], plot_options)
    } else if(! show_hdi && comp_value != null){
        $.plot($("#" + div_id), [{data: bar_data, bars: {show: true, align: "center", barWidth: bar_width}}, {data: comp_data, label: comp_label, lines: {lineWidth: 2}}, {data: mean_data, label: mean_label, points: { show: true }}], plot_options)
    } else if(show_hdi && comp_value != null){
        $.plot($("#" + div_id), [{data: bar_data, bars: {show: true, align: "center", barWidth: bar_width}}, {data: comp_data, label: comp_label, lines: {lineWidth: 2}}, {data: hdi_data, label: hdi_label, lines: {lineWidth: 5}}, {data: mean_data, label: mean_label, points: { show: true }}], plot_options)
    }else {
        $.plot($("#" + div_id), [{data: bar_data, bars: {show: true, align: "center", barWidth: bar_width}}, {data: mean_data, label: mean_label, points: { show: true }}], plot_options)
    }
}
