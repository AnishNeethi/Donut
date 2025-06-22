import React, { useState } from 'react'
import DonutScene from './DonutScene'

const DonutDemo = () => {
  const [sugarAmount, setSugarAmount] = useState(15)

  const handleSugarChange = (e) => {
    setSugarAmount(parseInt(e.target.value))
  }

  return (
    <div className="donut-demo">
      <h1>🍩 donut sugar visualizer</h1>
      <p>adjust the sugar slider to see donuts fall!</p>
      
      <div className="controls">
        <label htmlFor="sugar-slider">
          sugar amount: {sugarAmount}g
        </label>
        <input
          id="sugar-slider"
          type="range"
          min="0"
          max="50"
          value={sugarAmount}
          onChange={handleSugarChange}
          style={{ width: '300px', margin: '10px' }}
        />
      </div>
      
      <DonutScene sugarCount={sugarAmount} />
      
      <div className="info">
        <p>
          <strong>how it works:</strong> every 5g of sugar = 1 donut falling from the sky!
        </p>
        <p>
          try different values to see the physics simulation in action.
        </p>
      </div>
    </div>
  )
}

export default DonutDemo 