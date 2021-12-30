import * as d3 from "d3"

function init(results) {
	const container = d3.select("#vaccineGoals #graphicContainer")
	var clone = clone = JSON.parse(JSON.stringify(results));
	var data = clone.sheets.data
	var details = clone.sheets.template
	var labels = clone.sheets.labels
	var userKey = clone['sheets']['key']
	var context = d3.select("#vaccineGoals")

	// console.log(results)

	function numberFormat(num) {
        if ( num > 0 ) {
            if ( num > 1000000000 ) { return ( num / 1000000000 ) + 'bn' }
            if ( num >= 1000000 ) { return ( num / 1000000 ) + 'm' }
            if ( num > 1000 ) { return ( num / 1000 ) + 'k' }
            if (num % 1 != 0) { return num.toFixed(2) }
            else { return num.toLocaleString() }
        }
        if ( num < 0 ) {
            var posNum = num * -1;
            if ( posNum > 1000000000 ) return [ "-" + String(( posNum / 1000000000 )) + 'bn'];
            if ( posNum > 1000000 ) return ["-" + String(( posNum / 1000000 )) + 'm'];
            if ( posNum > 1000 ) return ["-" + String(( posNum / 1000 )) + 'k'];
            else { return num.toLocaleString() }
        }
        return num;
    }

	var isMobile;
	var windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

	if (windowWidth < 610) {
			isMobile = true;
	}

	if (windowWidth >= 610){
			isMobile = false;
	}

	var width = document.querySelector("#graphicContainer").getBoundingClientRect().width
	var height = width*0.6
	var margin = {top: 20, right: 70, bottom: 20, left:40}
	var dateParse = d3.timeParse("%Y-%m-%d")

	var scaleFactor = 1

	if (windowWidth < 820) {
		scaleFactor = windowWidth / 860
	}

	var keys = Object.keys(data[0])

	console.log(keys)


	function getLongestKeyLength(isMob) {
		if (!isMob) {
		return 50
		}
		return 0
	  }

	margin.right += getLongestKeyLength(isMobile)

	width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;


	context.select("#chartTitle").text(details[0].title)
    context.select("#subTitle").html(details[0].subtitle)
    context.select("#sourceText").html(details[0].source)
    // context.select("#footnote").html(details[0].footnote)
    context.select("#graphicContainer svg").remove();

    var chartKey = context.select("#chartKey");
	chartKey.html("");

	var svg = context.select("#graphicContainer").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.attr("id", "svg")
				.attr("overflow", "hidden");

	var features = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	var xVar;

	if (details[0]['xColumn']) {
		xVar = details[0]['xColumn'];
		keys.splice(keys.indexOf(xVar), 1);
	}

	else {
		xVar = keys[0]
		keys.splice(0, 1);
	}

	var colors = ["#7d0068", "#ea5a0b", "#d10a10","#7d0068"];

	var color = d3.scaleOrdinal();

	color.domain(keys).range(colors);

	var x = d3.scaleTime()
		.rangeRound([0, width]);

	var y = d3.scaleLinear()
		.rangeRound([height, 0]);

	var color = d3.scaleOrdinal()
		.range(colors);

	var lineGenerators = {};
	var allValues = [];

	// console.log("Xvar", xVar)
	keys.forEach(function(key,i) {

		lineGenerators[key] = d3.line()
			.x(function(d) {
				return x(d[xVar]);
				})
			.y(function(d) {
				return y(d[key]);
			})
		

		data.forEach(function(d) {

			if (typeof d[key] == 'string') {

				if (d[key].includes(",")) {
					if (!isNaN((d[key]).replace(/,/g, ""))) {
						d[key] = +(d[key]).replace(/,/g, "")
						allValues.push(d[key]);
					}

				}
				else if (d[key] != "") {

					if (!isNaN(d[key])) {

						d[key] = +d[key]
						allValues.push(d[key]);
					}
				}

				else if (d[key] == "") {
					d[key] = null
				}

			}

			else {
         		allValues.push(d[key]);
        	}
		});

	});

	data.forEach(function(d) {
		if (typeof d[xVar] == 'string') {
			// console.log("key", d[xVar])
			d[xVar] = dateParse(d[xVar])
			// console.log("key", d[xVar])
		}
	})

	var keyData = {}

	keys.forEach(function(key,i) {

		keyData[key] = []

		data.forEach(function(d) {
			// console.log("key", d[xVar])
			if (d[key] != null) {
				var newData = {}
				newData[xVar] = d[xVar]
				newData[key] = d[key]
				keyData[key].push(newData)
			}
			// else if (breaks == "yes") {
			// 	keyData[key].push(null)
			// }

		});
	})

	var shorter_data = data.filter(d => d.Date >= dateParse("2021-04-15"))
	// console.log(shorter_data)

	labels.forEach(function(d,i) {
		if (typeof d.x == 'string') {
			d.x = dateParse(d.x);
		}

		if (typeof d.y == 'string') {
			d.y = +d.y;
		}

		if (typeof d.offset == 'string') {
			d.offset = +d.offset;
		}

	})

	var min;

	if (details[0]['baseline'] === 'zero') {
		min = 0;
	}
	else {
		min = d3.min(allValues);
	}


	x.domain(d3.extent(data, function(d) { return d[xVar]; }));
	// y.domain([0, d3.max(allValues)])
	y.domain([0, 25000000])

	var xAxis;
	var yAxis;

	const xTicks = isMobile ? 4 : 6

	if (isMobile) {
		xAxis = d3.axisBottom(x).ticks(xTicks)
		yAxis = d3.axisLeft(y).tickFormat(function (d) { return numberFormat(d)}).ticks(5);
	}

	else {
		xAxis = d3.axisBottom(x).ticks(xTicks)
		yAxis = d3.axisLeft(y).tickFormat(function (d) { return numberFormat(d)});
	}


	// svg.append("svg:defs").append("svg:marker")
	// 	.attr("id", "arrow")
	// 	.attr("refX", 6)
	// 	.attr("refY", 6)
	// 	.attr("markerWidth", 20)
	// 	.attr("markerHeight", 20)
	// 	.attr("markerUnits","userSpaceOnUse")
	// 	.attr("orient", "auto")
	// 	.append("path")
	// 	.attr("d", "M 0 0 12 6 0 12 3 6")
	// 	.style("fill", "black")

	features.append("g")
		.attr("class","x")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	features.append("g")
		.attr("class","y")
		.call(yAxis)

	features.append("text")
		// .attr("transform", "rotate(90)")
		.attr("y", -15)
		.attr("x", 0)
		.attr("dy", "0.71em")
		.attr("fill", "#767676")
		.attr("text-anchor", "middle")
		.text(details[0].yAxisLabel);

	features.append("text")
		.attr("x", width)
		.attr("y", height - 6)
		.attr("fill", "#767676")
		.attr("text-anchor", "end")
		.text(details[0].xAxisLabel);

	context.selectAll(".tick line")
		.attr("stroke", "#767676")

	context.selectAll(".tick text")
		.attr("fill", "#767676")

	context.selectAll(".domain")
		.attr("stroke", "#767676")

	// (20619959 + 1243990)*0.9
	// ### ADD 90% LINE
		features.append("line")
		.attr("x1", 0)
		.attr("y1", y(19677554))
		.attr("x2", width)
		.attr("y2", y(19677554))
		.attr("class", "baseline")
		.style("stroke-width", 1)
		// .style("stroke", "black")
		.attr("stroke", "#000000")
		.style("stroke-dasharray", ("5, 5"))
		.style("opacity", 0.2)

		features.append("text")
		// .attr("x", x(parseTime(Peak_date)))
		.attr("x", 5)
		.attr("text-anchor", "start")
		.attr("y", (y(19677554) - 5))
		// .attr("class", "keyLabel").text(Math.round(min))
		.attr("class", "keyLabel")
		.text("90% of 12+ population")
		.style("opacity", 0.3);


	// ### ADD 80% LINE
		features.append("line")
		.attr("x1", 0)
		.attr("y1", y(17491159))
		.attr("x2", width)
		.attr("y2", y(17491159))
		.attr("class", "baseline")
		.style("stroke-width", 1)
		// .style("stroke", "black")
		.attr("stroke", "#000000")
		.style("stroke-dasharray", ("5, 5"))
		.style("opacity", 0.3)

		features.append("text")
		// .attr("x", x(parseTime(Peak_date)))
		.attr("x", 5)
		.attr("text-anchor", "start")
		.attr("y", (y(17491159) - 5))
		// .attr("class", "keyLabel").text(Math.round(min))
		.attr("class", "keyLabel")
		.text("80% of 12+ population")
		.style("opacity", 0.3);


	// ### ADD 70% LINE
	features.append("line")
	.attr("x1", 0)
	.attr("y1", y(15304764))
	.attr("x2", width)
	.attr("y2", y(15304764))
	.attr("class", "baseline")
	.style("stroke-width", 1)
	// .style("stroke", "black")
	.attr("stroke", "#000000")
	.style("stroke-dasharray", ("5, 5"))
	.style("opacity", 0.2)


	features.append("text")
	// .attr("x", x(parseTime(Peak_date)))
	.attr("x", 5)
	.attr("text-anchor", "start")
	.attr("y", (y(15304764) - 5))
	// .attr("class", "keyLabel").text(Math.round(min))
	.attr("class", "keyLabel")
	.text("70% of 12+ population")
	.style("opacity", 0.3);


	var greys = ["Second doses"]

	keys.forEach(function(key,i) {

		// console.log("Key", key)

		if (greys.some(stringo => key.includes(stringo))){
			// Make all the other lines

			features.append("path")
				.datum(keyData[key])
				.attr("fill", "none")
				.attr("stroke", "#d10a10")
				.attr("stroke-linejoin", "round")
				.attr("stroke-linecap", "round")
				.attr("stroke-width", 3)
				.style("opacity",  0.5)
				.attr("d", lineGenerators[key]);


			features
				.append("circle")
				.attr("cy", (d) => {
				return y(keyData[key][keyData[key].length - 1][key])
				})
				.attr("fill", "#d10a10")
				.attr("cx", (d) => {
				return x(keyData[key][keyData[key].length - 1][xVar])
				})
				.attr("r", 4)
				.style("opacity", 1)

			// console.log("testo", key)

		}


			if (key == "Trend") {

			features.append("path")
				.datum(keyData[key])
				.attr("fill", "none")
				.attr("stroke-dasharray","5,5")
				.attr("stroke", function (d) {
					return "#f5bd2c"
				})

				.attr("stroke-linecap", "round")
				.attr("stroke-width", 3)
				.style("opacity", 0.5)
				.attr("d", lineGenerators[key]);


			features
			  .append("circle")
			  .attr("cy", (d) => {
				return y(keyData[key][keyData[key].length - 1][key])
			  })
			  .attr("fill", "#f5bd2c")
			  .attr("cx", (d) => {
				return x(keyData[key][keyData[key].length - 1][xVar])
			  })
			  .attr("r", 4)
			  .style("opacity", 0.5)

			}

			if(key.includes("Boosters")) {

				features.append("path")
					.datum(keyData[key])
					.attr("fill", "none")
					.attr("stroke", "#7d0068")
					.attr("stroke-linejoin", "round")
					.attr("stroke-linecap", "round")
					.attr("stroke-width", 3)
					.attr("d", lineGenerators[key]);

				features
				  .append("circle")
				  .attr("cy", (d) => {
					return y(keyData[key][keyData[key].length - 1][key])
				  })
				  .attr("fill", "#7d0068")
				  .attr("cx", (d) => {
					return x(keyData[key][keyData[key].length - 1][xVar])
				  })
				  .attr("r", 4)
				  .style("opacity", 1)

				}

				var keyDiv = chartKey
								.append("div")
								.attr("class","keyDiv")

		  if (isMobile) {
			// if (!key.includes("Doses given")){

			if (greys.some(stringo => key.includes(stringo))){

				keyDiv.append("span")
					.attr("class", "keyCircle")
					.style("background-color", "#d10a10")

				keyDiv.append("span")
					.attr("class", "keyText")
					.text(key)
				} else if (key.includes("Boosters")){

						keyDiv.append("span")
							.attr("class", "keyCircle")
							.style("background-color", "#7d0068")

						keyDiv.append("span")
							.attr("class", "keyText")
							// .style("text-anchor", "end")
							.text(key)

					}

		  } else {


			if (key.includes("Boosters")){

        features
          .append("text")
          .attr("class", "lineLabels")
          .attr("y", (d) => {
            return (
              y(keyData[key][keyData[key].length - 1][key]) +
              4
            )
          })
          .attr("x", (d) => {
            return (
              x(keyData[key][keyData[key].length - 1][xVar]) + 5
            )
          })
          .style("opacity", 1)
          .attr("fill", color(key))
		//   .style("text-anchor", "middle")

          .text((d) => {
            return key
          })


		} else if(key.includes("Trend")){
			// console.log(key)
			features
			.append("text")
			.attr("class", "lineLabels")
			.attr("y", (d) => {
			  return (
				y(keyData[key][keyData[key].length - 1][key]) -
				10
			  )
			})
			.attr("x", (d) => {
			  return (
				x(keyData[key][keyData[key].length - 1][xVar])
			  )
			})
			.style("opacity", 0.7)
			.attr("fill", "#f5bd2c")
			.style("text-anchor", "middle")
			.text((d) => {
			  return key
			})

		} else if(key.includes("Second")){
			features
			.append("text")
			.attr("class", "lineLabels")
			.attr("y", (d) => {
			  return (
				y(keyData[key][keyData[key].length - 1][key]) -
				10
			  )
			})
			.attr("x", (d) => {
			  return (
				x(keyData[key][keyData[key].length - 1][xVar])
			  )
			})
			.style("opacity",  0.5)
			.attr("fill", "#d10a10")
			.style("text-anchor", "middle")
			.text((d) => {
			  return key
			})

		}
	}

	});

	context.selectAll(".annotationBox").remove()
	var footerAnnotations = context.select("#footerAnnotations")
    footerAnnotations.html("")

    var textBoxWidth = 220 * scaleFactor


    var dummyTextBox = container
        .append("div")
        .attr("class", `annotationBox`)
        .attr("id", "dummyTextBox")
        .style("position", "absolute")
        .style("width", textBoxWidth + "px")
        .style("top", 20)
        .style("left", -2000)
        .style("opacity", 0)
        .style("pointer-events", "none")

    function getTextBoxSize(boxWidth, text) {
	    dummyTextBox.text("")
	    dummyTextBox.attr("width", boxWidth + "px")
	    dummyTextBox.text(text)
	    // console.log(dummyTextBox.node().getBoundingClientRect())
	    return dummyTextBox.node().getBoundingClientRect()
	}

	// console.log(labels)

	function cleanLabels(s) {
		return s.replace(/<[^>]+>/g, '')
	}

	 labels.forEach( (d,i) => {

        var labelX1, labelX2, labelY1, labelY2,textX, textY, mobileYOffset;


		features
		      .append("line")
		      .attr("class", "annotationLine")
		      .attr("x1", labelX1)
		      .attr("y1", labelY1)
		      .attr("x2", labelX2)
		      .attr("y2", labelY2)
		      .style("opacity", 1)
		      .attr("marker-end", "url(#arrow)")
		      .attr("stroke", "#000")

		if (isMobile) {

		features.append("circle")
				.attr("class", "annotationCircle")
				.attr("cy", labelY1 - 4 + mobileYOffset)
		        .attr("cx", labelX1)
				.attr("r", 8)
				.attr("fill", "#000");

		features.append("text")
				.attr("class", "annotationTextMobile")
				.attr("y", labelY1 + mobileYOffset)
				.attr("x", labelX1)
				.style("text-anchor", "middle")
				.style("opacity", 1)
				.attr("fill", "#FFF")
				.text(i + 1);

		if (labels.length > 0 && i ==0) {
			footerAnnotations.append("span")
				.attr("class", "annotationFooterHeader")
				.text("Notes: ");
		}

		footerAnnotations.append("span")
			.attr("class", "annotationFooterNumber")
			.text(i+1 + " - ");

		if (i < labels.length -1 ) {
			footerAnnotations.append("span")
			.attr("class", "annotationFooterText")
			.text(cleanLabels(d.text) + ", ");
		}

		else {
			footerAnnotations.append("span")
				.attr("class", "annotationFooterText")
				.text(cleanLabels(d.text));
		}

	}

	else {

	container
        .append("div")
        .attr("class", `annotationBox ${d.align}`)
        .style("position", "absolute")
        .style("width", textBoxWidth + "px")
        .style("top", textY + "px")
        .style("left", textX + "px")
        .html(d.text)

	}


	


	})

	// ### Get the latest data for Boosters, and then draw a line to show the current gap 

	// console.log("Shorts",shorter_data)

	var booster_name = keys.filter(d => d.includes("Booster"))[0]
	var second_name = keys.filter(d => d.includes("Second"))[0]

	// ### Grab the current maximum number of boosters administered 
	var latest_boosters = shorter_data.reduce(function(prev, current) {
		return (prev[booster_name] > current[booster_name]) ? prev : current
	}) 

	var current_boosters = latest_boosters[booster_name]
	var current_booster_date = latest_boosters['Date']

	// ## Work out the equivalent day for second doses 
	var eq_second = shorter_data.filter(d => d[second_name] >= current_boosters)

	eq_second = eq_second.reduce(function(prev, current) {
		return (prev["Date"] < current["Date"]) ? prev : current
	})['Date']

	var current_gap = (current_booster_date - eq_second)  / 86400000
	var half_gap = current_gap / 2

	// console.log('Booster date', current_booster_date)
	// console.log("EQ second", eq_second)
	// console.log("Current gap", current_gap)
	console.log("Half gap", half_gap)
	// ## Add arrow defintion and then arrow 

	svg.append("svg:defs").append("svg:marker")
		.attr("id", "arrow")
		.attr("refX", 6)
		.attr("refY", 6)
		.attr("markerWidth", 15)
		.attr("markerHeight", 15)
		.attr("markerUnits","userSpaceOnUse")
		.attr("orient", "auto-start-reverse")
		.append("path")
		.attr("d", "M 0 0 12 6 0 12 3 6")
		.style("fill", "black")

		features.append("line")
		.attr("x1", x(eq_second) + 15)
		.attr("y1", y(current_boosters))
		.attr("x2", x(current_booster_date) - 15)
		.attr("y2", y(current_boosters))
		.attr("class", "baseline")
		.style("stroke-width", 1)
		// .style("stroke", "black")
		.attr("stroke", "#000000")
		.style("stroke-dasharray", ("5, 5"))
		.style("opacity", 0.5)
		.attr("marker-start","url(#arrow)")
		.attr("marker-end","url(#arrow)")

	
		var half_date = new Date(eq_second)
		half_date.setDate(half_date.getDate() + half_gap)
		console.log("Eq  sec date again", eq_second)
		console.log("Xers", half_date)



		features.append("text")
		.attr("x", x(half_date))
		.attr("text-anchor", "middle")
		.attr("y", (y(current_boosters) - 10))
		.attr("class", "keyLabel")
		.text(`${current_gap} days`)
		.style("opacity", 0.5);

}	// end init



Promise.all([
	d3.json(`https://interactive.guim.co.uk/yacht-charter-data/oz-live-corona-page-boosters-second-doses-tracker.json`)
	// d3.json(`https://interactive.guim.co.uk/yacht-charter-data/oz_vaccine_tracker_goals_trend_five_trend_test.json`)

	])
	.then((results) =>  {
		init(results[0])
		var to=null
		var lastWidth = document.querySelector("#graphicContainer").getBoundingClientRect()
		window.addEventListener('resize', function() {
			var thisWidth = document.querySelector("#graphicContainer").getBoundingClientRect()
			if (lastWidth != thisWidth) {
				window.clearTimeout(to);
				to = window.setTimeout(function() {
					    init(results[0])
					}, 100)
			}

		})

	});
