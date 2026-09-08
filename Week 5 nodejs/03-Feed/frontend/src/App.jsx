import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
const Feed = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Feed</div>} />
        <Route path="/create-post" element={<createPost />} />
      </Routes>
    </Router>
  )
}

export default Feed