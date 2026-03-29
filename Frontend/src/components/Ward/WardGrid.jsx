import React from 'react';
import WardCard from './WardCard';

const WardGrid = ({ wards, readOnly = false }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '32px',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {wards.map((ward) => (
        <WardCard key={ward.id} ward={ward} readOnly={readOnly} />
      ))}
    </div>
  );
};

export default WardGrid;
