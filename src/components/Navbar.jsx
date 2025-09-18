
import {NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

const Navbar = () => {
  return (
    <div>
      <nav>
        <ul className={styles.ull}>
            <li><NavLink className={({isActive})=> isActive ? styles.activeLink : ''} to='/'>Home</NavLink></li>
            <li><NavLink className={({isActive})=> isActive ? styles.activeLink : ''} to='/about'>About</NavLink></li>
            <li><NavLink className={({isActive})=> isActive ? styles.activeLink : ''} to='/dashboard'>Dashboard</NavLink></li>
        </ul>
      </nav>
    </div>
  )
}

export default Navbar
