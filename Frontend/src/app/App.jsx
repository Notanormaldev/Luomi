import React, { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { router } from './app.routes.jsx'
import { useauth } from './features/auth/hook/useauth.js'

function App() {
  const { handlegetme, loading, error } = useauth()

  useEffect(() => {
    handlegetme()
  }, [])

  if (loading) {
    return (
      <div className="lh-page-loader">
        <div className="lh-nano-bar"></div>
        <h1 className="lh-loader-logo">LUOMI</h1>
      </div>
    )
  }

  if (error && (error.isNetworkError || error.isServerError)) {
    return (
      <div className="lh-offline-screen">
        <h1 className="lh-loader-logo">LUOMI</h1>
        <div className="lh-offline-card">
          <h2>Maison Offline</h2>
          <p>{error.msg || "We are experiencing a temporary connection issue. Please check if the server is starting or asleep."}</p>
          <button className="lh-retry-btn" onClick={() => handlegetme()}>
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <RouterProvider router={router} />
    </div>
  )
}

export default App
