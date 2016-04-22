function retrieveAndConvertData(url, callback) {
    console.log("in");
    var json = {
        "xData": [],
        "datasets": [{
            "name": "Light",
            "data": [],
            "unit": "lux",
            "type": "spline",
            "valueDecimals": 0
        }, {
            "name": "Temperature",
            "data": [],
            "unit": "°C",
            "type": "spline",
            "valueDecimals": 2
        }, {
            "name": "Pressure",
            "data": [],
            "unit": "hPa",
            "type": "area",
            "valueDecimals": 2
        }, {
            "name": "Humidity",
            "data": [],
            "unit": "%",
            "type": "spline",
            "valueDecimals": 2
        }, {
            "name": "Average Current",
            "data": [],
            "unit": "mA",
            "type": "spline",
            "valueDecimals": 0
        }, {
            "name": "Voltage",
            "data": [],
            "unit": "mV",
            "type": "spline",
            "valueDecimals": 0
        }, {
            "name": "Available Energy",
            "data": [],
            "unit": "mWh",
            "type": "area",
            "valueDecimals": 0
        }, {
            "name": "TTE",
            "data": [],
            "unit": "mins.",
            "type": "spline",
            "valueDecimals": 0
        }]
    };
    $.get(url, function(data) {
	var lines = data.split('\n');
	for(var i = 0; i < lines.length; i++) {
            if (lines[i].length != 0) {
                //console.log('[' + i + '] ' + lines[i]);
		var raw = JSON.parse(lines[i]);
		var dt = Date.parse(raw[0].timestamp);
                json.xData.push(dt);
		json.datasets.forEach(function(obj) {
	            switch (obj.name) {
                        case "Light":
	                    obj.data.push(raw[1].light);
                            break;
                        case "Temperature":
	                    obj.data.push(raw[1].temp);
                            break;
                        case "Pressure":
	                    obj.data.push(raw[1].pres);
                            break;
                        case "Humidity":
	                    obj.data.push(raw[1].humi);
                            break;
                        case "Average Current":
	                    obj.data.push(raw[1].ac);
                            break;
                        case "Voltage":
	                    obj.data.push(raw[1].volt);
                            break;
                        case "Available Energy":
	                    obj.data.push(raw[1].sae);
                            break;
                        case "TTE":
	                    obj.data.push(raw[1].tte);
                            break;
			default:
                            console.log("unhandled object name");
                            break;
		    }
                });
	    }
	}
	/*
	console.log(json.xData);
        $.each(json.datasets, function (i, dataset) {
	    console.log('[' + i + ']: ' + dataset.data);
        });
	*/
        callback(json);
    });
    console.log("out");
}

function run() {

    /**
     * In order to synchronize tooltips and crosshairs, override the
     * built-in events with handlers defined on the parent element.
     */
    $('#container').bind('mousemove touchmove touchstart', function (e) {
        var chart,
            point,
            i,
            event;

        for (i = 0; i < Highcharts.charts.length; i = i + 1) {
            chart = Highcharts.charts[i];
            event = chart.pointer.normalize(e.originalEvent); // Find coordinates within the chart
            point = chart.series[0].searchPoint(event, true); // Get the hovered point

            if (point) {
                point.onMouseOver(); // Show the hover marker
                chart.tooltip.refresh(point); // Show the tooltip
                chart.xAxis[0].drawCrosshair(event, point); // Show the crosshair
            }
        }
    });
    /**
     * Override the reset function, we don't need to hide the tooltips and crosshairs.
     */
    Highcharts.Pointer.prototype.reset = function () {
        return undefined;
    };

    /**
     * Synchronize zooming through the setExtremes event handler.
     */
    function syncExtremes(e) {
        var thisChart = this.chart;

        if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
            Highcharts.each(Highcharts.charts, function (chart) {
                if (chart !== thisChart) {
                    if (chart.xAxis[0].setExtremes) { // It is null while updating
                        chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, { trigger: 'syncExtremes' });
                    }
                }
            });
        }
    }

    // Get the data. The contents of the data file can be viewed at
    // https://github.com/highcharts/highcharts/blob/master/samples/data/activity.json
    //$.getJSON('https://www.highcharts.com/samples/data/jsonp.php?filename=activity.json&callback=?', function (activity) {
    //$.getJSON('http://biloba.accrete.org:8000/highcharts/raw.json', function (json) {
    var url = 'http://biloba.accrete.org:8000/highcharts/raw.txt'
    retrieveAndConvertData(url, function (json) {
        $.each(json.datasets, function (i, dataset) {

            // Add X values
            dataset.data = Highcharts.map(dataset.data, function (val, j) {
                return [json.xData[j], val];
            });

            $('<div class="chart">')
                .appendTo('#container')
                .highcharts({
                    chart: {
                        marginLeft: 40, // Keep all charts left aligned
                        spacingTop: 20,
                        spacingBottom: 20
                    },
                    title: {
                        text: dataset.name,
                        align: 'left',
                        margin: 0,
                        x: 30
                    },
                    credits: {
                        enabled: false
                    },
                    legend: {
                        enabled: false
                    },
                    xAxis: {
                        type: 'datetime',
                        tickPixelInterval: 50,
                        crosshair: true,
                        events: {
                            setExtremes: syncExtremes
                        }
			/*
			,
                        labels: {
                            format: '{value} km'
                        }
			*/
                    },
                    yAxis: {
                        title: {
                            text: null
                        }
                    },
                    tooltip: {
                        positioner: function () {
                            return {
                                x: this.chart.chartWidth - this.label.width, // right aligned
                                y: -1 // align to title
                            };
                        },
                        borderWidth: 0,
                        backgroundColor: 'none',
                        pointFormat: '{point.y}',
                        headerFormat: '',
                        shadow: false,
                        style: {
                            fontSize: '18px'
                        },
                        valueDecimals: dataset.valueDecimals
                    },
                    series: [{
                        data: dataset.data,
                        name: dataset.name,
                        type: dataset.type,
                        color: Highcharts.getOptions().colors[i],
                        fillOpacity: 0.3,
                        tooltip: {
                            valueSuffix: ' ' + dataset.unit
                        }
                    }]
                });
        });
    });
}

function run_click() {
    $('#container').highcharts({
        chart: {
            type: 'spline',
            margin: [70, 50, 60, 80],
            events: {
                click: function (e) {
                    // find the clicked values and the series
                    //var x = e.xAxis[0].value,
	            var x = new Date().getTime();
                    var y = e.yAxis[0].value;
                    var series = this.series[0];

                    // Add it
                    series.addPoint([x, y]);
                }
            }
        },
        title: {
            text: 'Sensor Trace'
        },
        subtitle: {
            text: 'Click the plot area to add a point. Click a point to remove it.'
        },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 150,
        },
        yAxis: {
            title: {
                text: 'Value'
            },
            minPadding: 0.2,
            maxPadding: 0.2,
            maxZoom: 60,
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        tooltip: {
            formatter: function () {
                return '<b>' + this.series.name + '</b><br/>' +
                    Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                    Highcharts.numberFormat(this.y, 2);
            }
        },
        legend: {
            enabled: false
        },
        exporting: {
            enabled: false
        },
        plotOptions: {
            series: {
                lineWidth: 1,
                point: {
                    events: {
                        'click': function () {
                            if (this.series.data.length > 1) {
                                //this.remove();
                            }
                        }
                    }
                }
            }
        },
        series: [{
            name: 'sensor data',
            data: (function () {
                var data = [];
                var time = (new Date()).getTime();
                var i = 0;
                data.push({
                    x: time,
                    y: Math.random()
                });
                return data;
            }())
        }]
    });
}

function loop(series) {
	var x = (new Date()).getTime();
	var y = Math.random();
	series.addPoint([x, y], true, true);
}

function run_interval() {
    $(document).ready(function () {
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });

        $('#container').highcharts({
            chart: {
                type: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                events: {
                    load: function () {
                        // set up the updating of the chart each second
                        var series = this.series[0];
                        setInterval(function() {
                            loop(series);
                        }, 1000);
                    }
                }
            },
            title: {
                text: 'Live random data'
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
                title: {
                    text: 'Value'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                formatter: function () {
                    return '<b>' + this.series.name + '</b><br/>' +
                        Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                        Highcharts.numberFormat(this.y, 2);
                }
            },
            legend: {
                enabled: false
            },
            exporting: {
                enabled: false
            },
            series: [{
                name: 'Random data',
                data: (function () {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;

                    for (i = -19; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: Math.random()
                        });
                    }
                    return data;
                }())
            }]
        });
    });
}

$(function() {
	run();
});
