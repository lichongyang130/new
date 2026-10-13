export function DeploymentTimeline({ events = [] }: { events?: string[] }) {
  return <div>{events.map(event => <p key={event}>{event}</p>)}</div>;
}
