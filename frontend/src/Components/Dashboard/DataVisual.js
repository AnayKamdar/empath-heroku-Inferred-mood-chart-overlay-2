import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

function RadarChart(props) {
  const chartRef = useRef(null);

  useEffect(() => {
    // clear the svg
    d3.select(chartRef.current).selectAll("*").remove();

    const svg = d3.select(chartRef.current);

    // Define the blue gradient
    const blueGradient = svg
      .append("defs")
      .append("radialGradient")
      .attr("id", "blue-gradient");

    blueGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#1f2122")
      .attr("stop-opacity", 0);

    blueGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#0081f8")
      .attr("stop-opacity", 0.4);

    // Define the yellow gradient
    const yellowGradient = svg
      .append("defs")
      .append("radialGradient")
      .attr("id", "yellow-gradient");

    yellowGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#ffff00")
      .attr("stop-opacity", 0);

    yellowGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ffff00")
      .attr("stop-opacity", 0.4);

    const chartGroup = svg
      .append("g")
      .attr("transform", `translate(${270}, ${250})`);

    const data = props;
    console.log(props);
    const categories = data.map((d) => d.category);

    const sizeScale = d3.scaleLinear().domain([0, 1]).range([0, 200]);

    const radiusScale = d3.scaleLinear().domain([0, 1]).range([0, 200]);

    // Create the lines extending from the center
    chartGroup
      .selectAll(".radarLines")
      .data(categories)
      .enter()
      .append("line")
      .attr("class", "radarLines")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr(
        "x2",
        (d, i) =>
          radiusScale(1.05) *
          Math.cos((i * (2 * Math.PI)) / categories.length - Math.PI / 2)
      )
      .attr(
        "y2",
        (d, i) =>
          radiusScale(1.05) *
          Math.sin((i * (2 * Math.PI)) / categories.length - Math.PI / 2)
      )
      .style("stroke", "#aaaaaa")
      .style("stroke-width", 1);

    // Create the radar chart area
    const radarAreaGenerator = d3
      .radialArea()
      .angle((d, i) => (i * (2 * Math.PI)) / categories.length)
      .innerRadius(0)
      .outerRadius((d) => sizeScale(d.value))
      .curve(d3.curveCardinalClosed);

    const blobWrapper = chartGroup
      .selectAll(".radarWrapper")
      .data([data])
      .enter()
      .append("g")
      .attr("class", "radarWrapper");

    // Append the blue areas
    blobWrapper
      .append("path")
      .attr("class", "radarArea")
      .attr("d", radarAreaGenerator)
      .style("fill", "url(#blue-gradient)");

    // Append the yellow overlay areas
    blobWrapper
      .append("path")
      .attr("class", "radarAreaOverlay")
      .attr("d", radarAreaGenerator)
      .style("fill", "url(#yellow-gradient)")
      .style("fill-opacity", 0.7);  // This controls the opacity of the yellow overlay

    // Append the circles at each vertex of the radar chart
    blobWrapper
      .selectAll(".radarCircle")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "radarCircle")
      .attr("r", 5)
      .attr(
        "cx",
        (d, i) =>
          radiusScale(d.value) *
          Math.cos((i * (2 * Math.PI)) / categories.length - Math.PI / 2)
      )
      .attr(
        "cy",
        (d, i) =>
          radiusScale(d.value) * 
          Math.sin((i * (2 * Math.PI)) / categories.length - Math.PI / 2)
          )
          .style("fill", "#fff") // This could be set to any color that represents the points
          .style("fill-opacity", 0.8);
    
        // Append the text labels at each axis
        chartGroup
          .selectAll(".radarLabel")
          .data(categories)
          .enter()
          .append("text")
          .attr("class", "radarLabel")
          .attr("x", (d, i) =>
            radiusScale(1.25) *
            Math.cos((i * (2 * Math.PI)) / categories.length - Math.PI / 2)
          )
          .attr("y", (d, i) =>
            radiusScale(1.25) *
            Math.sin((i * (2 * Math.PI)) / categories.length - Math.PI / 2)
          )
          .text((d) => d)
          .style("text-anchor", "middle")
          .style("fill", "#fff")
          .style("font-size", "10px");
  
    
      }, [props.data]); 
    
      return (
        <svg ref={chartRef} width="100%" height="100%" viewBox="0 0 540 540"></svg>
      );
    }
    
    export default RadarChart;
    