import React from 'react';

const ApproachAvoidanceBar = ({ averageScore }) => {
    const normalizedScore = Math.min(Math.max(averageScore, -1), 1);
    const fillPercentage = (normalizedScore + 1) / 2 * 100;

    // Define the background as a gradient only for the filled portion.
    // The rest of the bar (unfilled portion) will remain transparent.
    const barStyle = {
        width: '100%',
        height: '30px',
        border: '2px solid #FFFFFF',
        borderRadius: '15px',
        background: `linear-gradient(to right, rgba(255, 0, 0, 1) 0%, rgba(0, 191, 255, 1) ${fillPercentage}%, transparent ${fillPercentage}%, transparent 100%)`,
        position: 'relative',
        overflow: 'hidden', // Ensures that the inner elements do not overflow the rounded borders
    };

    // No need for an overlay with this approach, the gradient and transparency create the desired effect.

    return (
        <div style={{ width: '100%', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '14px', color: '#ffffff', fontWeight: 'bold' }}>
                <span>Withdraw</span>
                <span>Approach</span>
            </div>
            <div style={barStyle} title={`Score: ${normalizedScore * 100}%`}>
                {/* Black Divider */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    backgroundColor: '#FFFFFF',
                }}></div>
            </div>
            <div className="score-percentage" style={{ textAlign: 'center', marginTop: '5px', color: '#FFFFFF' }}>
                {normalizedScore === 0 ? 'Neutral' : `${Math.round(Math.abs(normalizedScore) * 100)}% ${normalizedScore > 0 ? 'Approach' : 'Avoid'}`}
            </div>
        </div>
    );
};

export default ApproachAvoidanceBar;





// VERSION OF BAR STARTS FROM CENTER 0% and extends left or right
// import React from 'react';

// const ApproachAvoidanceBar = ({ averageScore }) => {
//     // Ensures score is within -1 to 1 range
//     const normalizedScore = Math.min(Math.max(averageScore, -1), 1);
//     // Calculates the width of the filled part based on the average score
//     const fillPercentage = (Math.abs(normalizedScore) / 2) * 100;

//     const getBarStyles = () => {
//         if (normalizedScore === 0) {
//             return {
//                 leftFillWidth: '0%',
//                 rightFillWidth: '0%',
//                 fillColor: '#FFFFFF'
//             };
//         } else if (normalizedScore > 0) {
//             // Fill to the right for Approach
//             return {
//                 leftFillWidth: '0%',
//                 rightFillWidth: `${fillPercentage}%`,
//                 fillColor: '#0000FF'
//             };
//         } else {
//             // Fill to the left for Avoid
//             return {
//                 leftFillWidth: `${fillPercentage}%`,
//                 rightFillWidth: '0%',
//                 fillColor: '#FF0000'
//             };
//         }
//     };

//     const { leftFillWidth, rightFillWidth, fillColor } = getBarStyles();

//     return (
//         <div style={{ width: '100%', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF'}}>
//                 <span>Avoid</span>
//                 <span>Approach</span>
//             </div>
//             <div
//                 style={{
//                     width: '100%',
//                     height: '30px',
//                     border: '2px solid #FFFFFF', // White border
//                     backgroundColor: 'transparent', // Neutral background color
//                     borderRadius: '15px',
//                     position: 'relative',
//                 }}
//                 title={`Score: ${normalizedScore}`}
//             >
//                 <div style={{
//                     position: 'absolute',
//                     top: '0',
//                     left: '50%',
//                     bottom: '0',
//                     width: leftFillWidth,
//                     backgroundColor: fillColor,
//                     borderRadius: '15px 0 0 15px',
//                     transition: 'width 0.5s ease-in-out',
//                 }} />
//                 <div style={{
//                     position: 'absolute',
//                     top: '0',
//                     right: '50%',
//                     bottom: '0',
//                     width: rightFillWidth,
//                     backgroundColor: fillColor,
//                     borderRadius: '0 15px 15px 0',
//                     transition: 'width 0.5s ease-in-out',
//                 }} />
//             </div>
//             <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '14px', color: '#FFFFFF'  }}>
//                 {normalizedScore === 0 ? 'Neutral' : `${(Math.abs(normalizedScore) * 100).toFixed(2)}% ${normalizedScore > 0 ? 'Approach' : 'Avoid'}`}
//             </div>
//         </div>
//     );
// };

// export default ApproachAvoidanceBar;

