import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { CoursePage } from '@/pages/CoursePage'
import { LessonPage } from '@/pages/LessonPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/course" element={<CoursePage />} />
        <Route path="/course/:moduleSlug/:lessonSlug" element={<LessonPage />} />
      </Routes>
    </Router>
  )
}

export default App
