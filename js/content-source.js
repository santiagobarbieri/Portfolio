// Local previews and not-yet-connected deployments retain the existing catalog.
export async function loadCatalog(kind, localPath) {
  let response;
  try {
    response = await fetch(`/api/content?kind=${encodeURIComponent(kind)}`, {signal:AbortSignal.timeout(12000)});
  } catch {
    throw new Error('The catalog could not be reached. Please try again.');
  }
  if (response.status===404) return localCatalog(localPath);
  if (!response.ok) {
    const error = await response.json().catch(()=>({}));
    if (response.status===503 && error.error==='CONTENT_NOT_CONFIGURED') return localCatalog(localPath);
    throw new Error('The catalog could not be loaded. Please try again.');
  }
  return response.json();
}
async function localCatalog(path) {
  const response=await fetch(path,{cache:'no-cache'});
  if (!response.ok) throw new Error('The catalog could not be loaded.');
  return response.json();
}
