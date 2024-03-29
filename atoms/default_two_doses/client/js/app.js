import * as d3 from "d3"

function init(results) {
	const container = d3.select("#vaccineGoals #graphicContainer")
	var clone = clone = JSON.parse(JSON.stringify(results));
	var data = clone.sheets.data
	var details = clone.sheets.template
	var labels = clone.sheets.labels
	var userKey = clone['sheets']['key']
	var breaks = "no"
	var context = d3.select("#vaccineGoals")


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
	var dateParse = d3.timeParse(details[0]['dateFormat'])

	var scaleFactor = 1

	if (windowWidth < 820) {
		scaleFactor = windowWidth / 860
	}

	// console.log("scaleFactor",scaleFactor)


	var keys = Object.keys(data[0])



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
    context.select("#footnote").html(details[0].footnote)
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

	// console.log(xVar, keys);

	var colors = ["#d10a10", "#ea5a0b", "#cccccc","#d10a10"];

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

	keys.forEach(function(key,i) {

		if (breaks === "yes") {
		lineGenerators[key] = d3.line()
			.defined(function(d) {
        		return d;
    		})
			.x(function(d) {
				return x(d[xVar]);
				})
			.y(function(d) {
				return y(d[key]);
			});
		}

		else if (breaks === "no") {
			lineGenerators[key] = d3.line()
				.x(function(d) {
					return x(d[xVar]);
					})
				.y(function(d) {
					return y(d[key]);
				});
		}


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
			d[xVar] = dateParse(d[xVar])
		}
	})

	var keyData = {}

	keys.forEach(function(key,i) {
		keyData[key] = []

		data.forEach(function(d) {
			if (d[key] != null) {
				var newData = {}
				newData[xVar] = d[xVar]
				newData[key] = d[key]
				keyData[key].push(newData)
			}
			else if (breaks == "yes") {
				keyData[key].push(null)
			}

		});
	})

	var shorter_data = data.filter(d => d.Date >= dateParse("2021-04-15"))
	// console.log(shorter_data)
	var areaData = shorter_data.filter(d => {return d[xVar] <= keyData[keys[0]][keyData[keys[0]].length - 1][xVar] })
	console.log("keydata", keyData)
	console.log("areaData", areaData)

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
	y.domain([0, d3.max(allValues)])

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


	svg.append("svg:defs").append("svg:marker")
		.attr("id", "arrow")
		.attr("refX", 6)
		.attr("refY", 6)
		.attr("markerWidth", 20)
		.attr("markerHeight", 20)
		.attr("markerUnits","userSpaceOnUse")
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M 0 0 12 6 0 12 3 6")
		.style("fill", "black")

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

	// var areaPath = features.selectAll(".areaPath").data()

	// features.append("path")
	// 		.datum(areaData)
	// 		.attr("class", "areaPath")
	// 		.attr("fill", "rgb(245, 189, 44)")
	// 		.attr("opacity", 0.6)
	// 		.attr("stroke", "none")
	// 		.attr("d", area)

	// var greys = ["goal", "EOY"]


	// ### ADD 90% LINE
		features.append("line")
		.attr("x1", 0)
		.attr("y1", y(18557963))
		.attr("x2", width)
		.attr("y2", y(18557963))
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
		.attr("y", (y(18557963) - 5))
		// .attr("class", "keyLabel").text(Math.round(min))
		.attr("class", "keyLabel")
		.text("90% of 16+ population")
		.style("opacity", 0.3);


	// ### ADD 80% LINE
		features.append("line")
		.attr("x1", 0)
		.attr("y1", y(16495967))
		.attr("x2", width)
		.attr("y2", y(16495967))
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
		.attr("y", (y(16495967) - 5))
		// .attr("class", "keyLabel").text(Math.round(min))
		.attr("class", "keyLabel")
		.text("80% of 16+ population")
		.style("opacity", 0.3);


	// ### ADD 70% LINE
	features.append("line")
	.attr("x1", 0)
	.attr("y1", y(14433971))
	.attr("x2", width)
	.attr("y2", y(14433971))
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
	.attr("y", (y(14433971) - 5))
	// .attr("class", "keyLabel").text(Math.round(min))
	.attr("class", "keyLabel")
	.text("70% of 16+ population")
	.style("opacity", 0.3);


		var greys = ["goal"]

	keys.forEach(function(key,i) {

		if (greys.some(stringo => key.includes(stringo))){
			// Make all the other lines

			features.append("path")
				.datum(keyData[key])
				.attr("fill", "none")
				.attr("stroke", "#cccccc")
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
				.attr("fill", "#cccccc")
				.attr("cx", (d) => {
				return x(keyData[key][keyData[key].length - 1][xVar])
				})
				.attr("r", 4)
				.style("opacity", 1)

		}

		// if (key.some(substring=>yourBigString.includes(substring)))

		// console.log(keyData[key])

		// if (key == "Trend" || key == "First dose by EOY") {
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

			if(key.includes("Fully vaccinated")) {

				features.append("path")
					.datum(keyData[key])
					.attr("fill", "none")
					.attr("stroke", "#d10a10")
					.attr("stroke-linejoin", "round")
					.attr("stroke-linecap", "round")
					.attr("stroke-width", 3)
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

				}

				var keyDiv = chartKey
								.append("div")
								.attr("class","keyDiv")

		  if (isMobile) {
			// if (!key.includes("Doses given")){

			if (greys.some(stringo => key.includes(stringo))){

				keyDiv.append("span")
					.attr("class", "keyCircle")
					.style("background-color", "#cccccc")

				keyDiv.append("span")
					.attr("class", "keyText")
					.text(key)
				} else if (key.includes("Fully vaccinated")){

						keyDiv.append("span")
							.attr("class", "keyCircle")
							.style("background-color", "#d10a10")

						keyDiv.append("span")
							.attr("class", "keyText")
							// .style("text-anchor", "end")
							.text(key)

					}

		  } else {


			if (key.includes("Fully vaccinated")){

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
			console.log(key)
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

		} else if(key.includes("goal")){
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
				x(keyData[key][keyData[key].length - 1][xVar]) - 10
			  )
			})
			.style("opacity",  0.5)
			.attr("fill", "#cccccc")
			.style("text-anchor", "end")
			.text((d) => {
			  return key
			})

		}
	}

	});



	// Eight goal: 16495967.200000001
	// Seven goal: 14433971.299999999

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
	    console.log(dummyTextBox.node().getBoundingClientRect())
	    return dummyTextBox.node().getBoundingClientRect()
	}

	console.log(labels)

	function cleanLabels(s) {
		return s.replace(/<[^>]+>/g, '')
	}

	 labels.forEach( (d,i) => {

        var labelX1, labelX2, labelY1, labelY2,textX, textY, mobileYOffset;

        if (d.direction === "right") {
        	labelX1 = x(d.x) + (d.offset * scaleFactor)
        	labelX2 = x(d.x) + 6
        	labelY1 = y(d.y)
        	labelY2 = y(d.y)
        	textX = x(d.x) + (d.offset * scaleFactor) + margin.left + 5
        	textY = y(d.y) + margin.top - 12
        	mobileYOffset = 4
        }

        else if (d.direction === "top") {

        	labelX1 = x(d.x)
        	labelX2 = x(d.x)
        	labelY1 = y(d.y) - (d.offset * scaleFactor)
        	labelY2 = y(d.y) - 6
  			textX = x(d.x) + margin.left - (textBoxWidth /2)
        	textY = y(d.y) - (d.offset * scaleFactor) + margin.top - getTextBoxSize(textBoxWidth, d.text).height - 5
        	mobileYOffset = 0

        	if (d.align === "middle") {
        		textX = x(d.x) + margin.left - (textBoxWidth /2)
        	}

        	else if (d.align === "left") {
        		textX = x(d.x) + margin.left - (textBoxWidth)
        	}

        	else if (d.align === "right") {
        		textX = x(d.x) + margin.left - 10
        	}

        }

       else if (d.direction === "bottom") {

        	labelX1 = x(d.x)
        	labelX2 = x(d.x)
        	labelY1 = y(d.y) + (d.offset * scaleFactor)
        	labelY2 = y(d.y) + 6
  				textX = x(d.x) + margin.left - (textBoxWidth /2)
        	textY = y(d.y) + (d.offset * scaleFactor) + margin.top
        	mobileYOffset = 0

        	if (d.align === "middle") {
        		textX = x(d.x) + margin.left - (textBoxWidth /2)
        	}

        	else if (d.align === "left") {
        		textX = x(d.x) + margin.left - (textBoxWidth)
        	}

        	else if (d.align === "right") {
        		textX = x(d.x) + margin.left - 10
        	}

        }

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





	// firstRun = false

}	// end init



Promise.all([
	d3.json(`https://interactive.guim.co.uk/yacht-charter-data/oz_vaccine_tracker_goals_trend_five_trend.json`)
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
