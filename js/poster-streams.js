export function initPosterStreams() {
  const section = document.querySelector('.posters-intro');
  if (!section) return;
  for (const track of section.querySelectorAll('.poster-stream-track')) {
    const copy = track.firstElementChild.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.append(copy);
  }
  let visible = false;
  let paused = false;
  const sync = () => section.classList.toggle('streams-running', visible && !paused && !document.hidden);
  new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; sync();}).observe(section);
  document.addEventListener('visibilitychange', sync);
  const button = section.querySelector('.poster-stream-toggle');
  button.addEventListener('click', () => {
    paused = !paused;
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = paused ? 'Play motion' : 'Pause motion';
    sync();
  });
}
