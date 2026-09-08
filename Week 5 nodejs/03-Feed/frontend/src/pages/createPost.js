import React from 'react'

export const createPost = () => {
  return (
    <section>
      <h2>Create Post</h2>
      <form>
        <input type="text" placeholder="Caption" />
        <input type="file" accept="image/*" /> 
        <button type="submit">Upload</button>
      </form>
    </section>
  )
}
