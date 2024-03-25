import React, { useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { format, subWeeks, subMonths } from 'date-fns';
import './Dashboard.css';

const TIME_FILTERS = {
  ONE_WEEK: '1week',
  TWO_WEEKS: '2weeks',
  ONE_MONTH: '1month',
  ALL: 'all',
};


const HealthDashboard = ({ healthData, timeFilter, setTimeFilter }) => {
  const [selectedTab, setSelectedTab] = useState('sleep');
  let averageValue;

  const calculateAverage = (data) => {
    const filteredData = data
    if (filteredData.length === 0) return 0
    const total = filteredData.reduce((sum, item) => sum + Number(item[selectedTab]), 0);
    return total / filteredData.length;
  };

const calculateAverageSleepTime = (data) => {
  if (data.length === 0) return 0;
  const totalSleepInSeconds = data.reduce((sum, sleepData) => sum + Number(sleepData.sleep), 0);
  return totalSleepInSeconds / data.length;
};

  const parseDate = (dateString) => new Date(dateString);

  const filterDataByTime = (data) => {
    const currentDate = new Date();
  
    
    const filteredDataWithoutNull = data.filter((item) => item && item.date && item.date !== null && item.date !== undefined);
  
    switch (timeFilter) {
      case TIME_FILTERS.ONE_WEEK:
        return filteredDataWithoutNull.filter((item) => new Date(item.date) >= subWeeks(currentDate, 1));
      case TIME_FILTERS.TWO_WEEKS:
        return filteredDataWithoutNull.filter((item) => new Date(item.date) >= subWeeks(currentDate, 2));
      case TIME_FILTERS.ONE_MONTH:
        return filteredDataWithoutNull.filter((item) => new Date(item.date) >= subMonths(currentDate, 1));
      default:
        return filteredDataWithoutNull;
    }
  };

  const filterByDataType = (data, dataType) => {
    return data.filter(item => item.dataType === dataType);
  };

  const convertMetersToMiles = (meters) => {
    const metersToMilesConversion = 0.000621371;
    const fixednum = Number(meters ? meters * metersToMilesConversion : 0).toFixed(2);
    return Number(fixednum)
  };
 
  const aggregateSleepData = (sleepResults) => {
    let dailySleepData = {};  
    sleepResults.forEach(sleepEntry => {
      if (sleepEntry) {
        const startDateFormatted = format(parseDate(sleepEntry.startDate), 'yyyy-MM-dd');
        if (!dailySleepData[startDateFormatted]) {
          dailySleepData[startDateFormatted] = 0;
        }
        const fixedSleep = (sleepEntry.value / 3600).toFixed(2);
        dailySleepData[startDateFormatted] += Number(fixedSleep); // Convert seconds to hours
      }
    });
    return dailySleepData;
  };

  const renderGraph = () => {
    let formattedData = [];
    let legendTitle = "";

    const filteredHealthData = filterByDataType(healthData, selectedTab);
    if (selectedTab === 'sleep') {
      legendTitle = "hours";
      const aggregatedSleepData = aggregateSleepData(filteredHealthData);
      formattedData = Object.keys(aggregatedSleepData).map(date => ({
        date: date,
        sleep: aggregatedSleepData[date]
      }));
    } else if (selectedTab === 'steps') {
      legendTitle = "steps";
      formattedData = filteredHealthData.map(data => {
        const startDateFormatted = format(parseDate(data.startDate), 'yyyy-MM-dd');

        return {
          date: startDateFormatted,
          [selectedTab]: data.value
        };
      });
      //console.log("steps", formattedData)
    } else if (selectedTab === 'distance') {
      legendTitle = "miles";
      formattedData = filteredHealthData.map(data => {
        const startDateFormatted = format(parseDate(data.startDate), 'yyyy-MM-dd');

        return {
          date: startDateFormatted,
          [selectedTab]: convertMetersToMiles(data.value)
        };
      });
      //console.log("distance", formattedData)
    }
    formattedData.sort((a, b) => new Date(a.date) - new Date(b.date));
    const filteredData = filterDataByTime(formattedData);
  
    if (selectedTab === 'sleep') {
      averageValue = calculateAverageSleepTime(filteredData);
    } else {
      averageValue = calculateAverage(filteredData);
    }
  
    if (filteredData.length === 0) {
      return (
        <div className="graph-container">
          <p style={{ color: 'white' }}>Client has no health data</p>
        </div>
      );
    }

    return (
      <div className="bar-container">
      <div className="average-header">
        <p style={{ color: 'white', textAlign: 'center' }}>
          Average {selectedTab}: {averageValue.toFixed(2)} {legendTitle}
        </p>
      </div>
      <ResponsiveBar
        data={filteredData}
        keys={[selectedTab]}
        indexBy="date"
          margin={{ top: 20, right: 10, bottom: 60, left: 50 }}
          padding={0.3}
          colors={["#b0d4e8"]}
          enableLabel={false}
          borderRadius={3}
          axisBottom={{
            tickRotation: -90,
            legendOffset: 50,
            tickTextStyle: { fill: 'white' },
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 5,
            tickRotation: 0,
            legend: legendTitle,
            legendPosition: 'middle',
            legendOffset: -45
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          theme={{
        axis: {
          ticks: {
            text: {
              fill: 'white'
            }
          },
          legend: {
            text: {
              fill: 'white'
            }
          }
        },
        grid: {
          line: {
              stroke: '#ddd', 
              strokeWidth: 0.1, 
          }
      }
      }}
        />
      </div>
    );
  };

  return (
    <div className="health-dashboard">
      <div className="graph-container">
      <h3 className="radarChartTitle">Health Data</h3>
        <div className="health-filter-container" style={{ boxShadow: '0px 0px 0px rgba(0,0,0,0.5)'}}>
          <div className="button-container">
          <button className={selectedTab === 'steps' ? 'active' : ''} onClick={() => setSelectedTab('steps')}>
            Steps
          </button>
          <button className={selectedTab === 'distance' ? 'active' : ''} onClick={() => setSelectedTab('distance')}>
            Distance
          </button>
          <button className={selectedTab === 'sleep' ? 'active' : ''} onClick={() => setSelectedTab('sleep')}>
            Sleep
          </button>
        </div>
        <div className="filter-container">
          <button className={timeFilter === TIME_FILTERS.ONE_WEEK ? 'active' : ''} onClick={() => setTimeFilter(TIME_FILTERS.ONE_WEEK)}>
            1 Week
          </button>
          <button className={timeFilter === TIME_FILTERS.TWO_WEEKS ? 'active' : ''} onClick={() => setTimeFilter(TIME_FILTERS.TWO_WEEKS)}>
            2 Weeks
          </button>
          <button className={timeFilter === TIME_FILTERS.ONE_MONTH ? 'active' : ''} onClick={() => setTimeFilter(TIME_FILTERS.ONE_MONTH)}>
            1 Month
          </button>
          <button className={timeFilter === TIME_FILTERS.ALL ? 'active' : ''} onClick={() => setTimeFilter(TIME_FILTERS.ALL)}>
            All
          </button>
        </div>
        {renderGraph()}
      </div>
    </div>

  </div>
);
};

export default HealthDashboard;
