export function RuntimeHealth({ healthy = true }: { healthy?: boolean }) {
  return <span>{healthy ? 'Runtime Healthy' : 'Runtime Error'}</span>;
}
