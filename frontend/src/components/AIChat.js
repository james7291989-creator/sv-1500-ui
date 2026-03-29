import React from 'react';

const AIChat = () => {
  return (
    <div style={{ 
      backgroundColor: '#dc2626', 
      color: 'white', 
      padding: '80px 20px', 
      margin: '20px', 
      borderRadius: '20px', 
      textAlign: 'center', 
      border: '5px solid black',
      boxShadow: '0px 10px 30px rgba(0,0,0,0.5)'
    }}>
      <h1 style={{ fontSize: '40px', fontWeight: '900', textTransform: 'uppercase', margin: '0' }}>
        SYSTEM OVERRIDE SUCCESSFUL
      </h1>
      <p style={{ fontSize: '20px', marginTop: '20px', fontWeight: 'bold' }}>
        CEO, if you see this massive red box, the routing is perfect. The issue was just the CSS engine dropping the luxury paint!
      </p>
    </div>
  );
};

export default AIChat;