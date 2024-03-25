import React, { useEffect } from 'react';

const StripePricingTable = ({ therapistId }) => {
  useEffect(() => {
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;

    // Append script to the body
    document.body.appendChild(script);

    // Clean up
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="stripe-pricing-table-container">
      <stripe-pricing-table
        pricing-table-id="prctbl_1OZV8WLcqNH1INtcScyNwEBK"
        publishable-key="pk_live_51Nak0TLcqNH1INtczpx05dddKzs1Od3OlNUGEFNbkGtABYMhjByTa1lzV4t1TEUXFAbHQXrovFVq5coTljBvVct000TXWhLHGB"
        client-reference-id={therapistId}>
      </stripe-pricing-table>
    </div>
  );
};

export default StripePricingTable;
