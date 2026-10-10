import { Hero } from '../components/Hero'
import { RankingSection } from '../components/RankingSection'
import { QuizPromo } from '../components/QuizPromo'
import { RecentAnalysis } from '../components/RecentAnalysis'

export function HomePage() {
  return (
    <>
      <Hero />
      <RankingSection />
      <QuizPromo />
      <RecentAnalysis />
    </>
  )
}