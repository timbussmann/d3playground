d3.dsv(";", "logiernaechte.csv", d => { return d; })
    .then(csv => {

        var data = prepareData(csv);

        d3.select("#yearSelect")
            .on("change", function () { updateGraph(data, parseInt(this.value)) })
            .selectAll("option")
            .data(data, d => d.year)
            .enter()
            .append("option")
            .attr("value", (_, i) => i)
            .text(d => d.year);

        var minYear = d3.min(data, d => d.year);
        var maxYear = d3.max(data, d => d.year);
        d3.select("#yearSlider")
            .on("change", function () { updateGraph(data, parseInt(this.value)) })
            .attr("min", 0)
            .attr("max", maxYear - minYear);

        updateGraph(data, 0);
    });

function updateGraph(allData, index) {
    d3.select("#yearSlider").property("value", index);
    d3.select("#yearSelect").property("value", index);

    console.log(index)
    const textwidth = 200;
    var stays = allData[index].stays;

    var lengthScale = d3.scaleLinear()
        .domain([0, d3.max(stays, n => n.nights)])
        .range([0, 600]);

    var bars = d3.select("svg")
        .selectAll("g")
        .data(stays);

    // update:
    bars.select(".nightsText")
        .transition()
        .attr("x", d => lengthScale(d.nights) + textwidth)
        .text(d => d.nights);
    bars.select(".countryText")
        .text(d => d.country);
    bars.select("rect")
        .transition()
        .attr("width", d => lengthScale(d.nights))
        .attr("fill", (d, i) => {
            if (index == 0) {
                return "blue";
            }

            var prevIndex = allData[index - 1].stays.findIndex(e => e.country === d.country);

            if (prevIndex == -1) {
                return "yellow";
            }

            if (prevIndex < i) {
                return "red";
            }

            if (prevIndex > i) {
                return "green";
            }

            return "blue";
        });

    // exit:
    bars.exit().remove();

    // enter:  
    var row = bars.enter().append("g");
    row.append("rect")
        .attr("width", d => lengthScale(d.nights))
        .attr("x", textwidth)
        .attr("y", (d, i) => i * 25)
        .attr("height", 20)
        .attr("fill", "blue");

    row.append("text")
        .classed("nightsText", true)
        .attr("y", (d, i) => i * 25 + 15)
        .attr("x", d => lengthScale(d.nights) + textwidth)
        .text(d => d.nights);

    row.append("text")
        .classed("countryText", true)
        .attr("y", (d, i) => i * 25 + 15)
        .attr("x", textwidth - 10)
        .attr("text-anchor", "end")
        .text(d => d.country);
}

function prepareData(csv) {
    var data = [];
    for (let i = 0; i < csv.length; i++) {
        var currentYear = csv[i];
        var props = Object.getOwnPropertyNames(currentYear);
        var stays = [];
        for (var p of props) {
            if (p.endsWith("Logiernächte")) {
                var nights = Number.parseInt(currentYear[p]);
                if (nights) {
                    stays.push({ country: p.slice(0, -"Logiernächte".length), nights: nights });
                }
            }
        }

        stays = stays.sort((a, b) => b.nights - a.nights);
        staysRest = stays.slice(18); // take all but the first 19 entries
        nightsRest = staysRest.reduce((acc, x) => acc + x.nights, 0);
        stays.splice(19, stays.length - 19, { country: "Restliche", nights: nightsRest });

        data.push({ year: csv[i].Jahr, stays: stays });
    }
    return data;
}