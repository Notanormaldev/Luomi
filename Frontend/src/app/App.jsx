import React from 'react'
import { RouterProvider } from 'react-router'
import { router } from './app.routes.jsx'

function App() {
  return (
    <div>
      <RouterProvider router={router}/>
    </div>
  )
}

export default App
