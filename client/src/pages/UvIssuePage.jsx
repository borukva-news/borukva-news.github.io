import { UvCarouselScreen } from '../components/UvCarouselScreen';
import { UV_ISSUE } from '../data/issues';

export function UvIssuePage() {
  return <UvCarouselScreen title="Borukva News" pages={UV_ISSUE.pages} hotspotFile={UV_ISSUE.hotspotFile} />;
}
