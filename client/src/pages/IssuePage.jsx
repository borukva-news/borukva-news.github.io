import { CarouselScreen } from '../components/CarouselScreen';
import { ISSUES } from '../data/issues';

export function IssuePage({ issueKey }) {
  const issue = ISSUES[issueKey];
  if (!issue) return <div className="carousel-screen" />;
  return <CarouselScreen title="Borukva News" pages={issue.pages} hotspotFile={issue.hotspotFile} />;
}
