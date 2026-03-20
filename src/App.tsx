import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Theme } from '@radix-ui/themes'
import { useQuizStore } from '@/store/quizStore'
import { Welcome } from '@/pages/Welcome'
import { Contact } from '@/pages/Contact'
import { Quiz } from '@/pages/Quiz'
import { Generating } from '@/pages/Generating'
import { Result } from '@/pages/Result'
import { useTheme } from '@/hooks/useTheme'

function AppRouter() {
  const step = useQuizStore((s) => s.step)
  const planId = useQuizStore((s) => s.planId)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/plan/:planId" element={<Result />} />
        <Route
          path="/"
          element={
            step === 'welcome'    ? <Welcome /> :
            step === 'contact'    ? <Contact /> :
            step === 'quiz'       ? <Quiz /> :
            step === 'generating' ? <Generating /> :
            step === 'result' && planId ? <Navigate to={`/plan/${planId}`} replace /> :
            <Welcome />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  const { isDark } = useTheme()

  return (
    <Theme
      appearance={isDark ? 'dark' : 'light'}
      accentColor="indigo"
      grayColor="slate"
      radius="medium"
      scaling="100%"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <AppRouter />
    </Theme>
  )
}
