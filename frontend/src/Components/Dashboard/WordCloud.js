import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

const WordCloud = ({ words }) => {
    const chartRef = useRef();

    const width = 700;
    const height = 170;

    useEffect(() => {
        // clear the svg
        d3.select(chartRef.current).selectAll("*").remove();

        // Create a word cloud layout
        const layout = cloud()
      .size([width, height])
      .words(
        words
          .map((word) => {
            const sizeScale = d3
              .scaleLinear()
              .domain([d3.min(words, (d) => d.value), d3.max(words, (d) => d.value)])
              .range([40, 70]);
            return { text: word.text, size: sizeScale(word.value) };
          })
      )
        .padding(5)
        .rotate(0)
        .fontSize(d => d.size)
        .on("end", draw);

        // Generate the word cloud layout
        layout.start();

        // Draw the word cloud
        function draw(words) {
          const svg = d3.select(chartRef.current);
      
          // Define a scale for the opacity
          const opacityScale = d3.scaleLinear()
              .domain([20, 70])
              .range([0.4, 1]);
      
          // Word Cloud
          svg.append("g")
              .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
              .selectAll("text")
              .data(words)
              .enter().append("text")
              .style("font-size", d => d.size + "px")
              .style("fill", "#fff")
              .style("fill-opacity", d => opacityScale(d.size))
              .attr("text-anchor", "middle")
              .attr("transform", d => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
              .text(d => d.text);
      }      
    }, [words]);

    return (
        <svg ref={chartRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}></svg>
    );
};

export default WordCloud;
