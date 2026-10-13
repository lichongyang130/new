export function PreviewEnvironment({ url }: { url?: string }) {
  return <section>{url ? <a href={url}>{url}</a> : 'No preview available'}</section>;
}
