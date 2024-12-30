import React from 'react'
import './Navbar.css'
import map from '../../assets/map.png'
import animals from '../../assets/livestock.png';

export const Navbar: React.FC = () => {
  return (
    <div>
      <nav className="navbar">
        <ul>
          <li>
            <img src={map} alt="" className='map-icon' />
          </li>
          <li>
            <img src={animals} alt="" className='animals-icon' />
          </li>
        </ul>
      </nav>
    </div>
  )
}

