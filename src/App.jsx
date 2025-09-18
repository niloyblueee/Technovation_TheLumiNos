import React from 'react'
import { createBrowserRouter,RouterProvider } from 'react-router-dom'
import Home from './components/Home'
import About from './components/About'
import Dashboard from './components/Dashboard'
import Navbar from './components/Navbar'

let router= createBrowserRouter([
  {path:'/',
   element: <>
   <Navbar/>
   <Home/>
   </>
  },
  {path:'/about',
   element: <>
   <Navbar/>
   <About/>
   </>
  },
  {path:'/dashboard',
   element: <>
   <Navbar/>
   <Dashboard/>
   </>
  }
])

const App = () => {
  return (
    <div>
      <RouterProvider router={router}></RouterProvider>
    </div>
  )
}

export default App
