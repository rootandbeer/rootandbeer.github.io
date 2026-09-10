// Apply root&beer theme to EmGitHub embeds after they load.
function applyEmgithubTheme(): void {
  document.querySelectorAll<HTMLElement>('.emgithub-container').forEach((container) => {
    container.classList.add('emgithub-theme-rootandbeer');
  });

  document.querySelectorAll<HTMLElement>('.emgithub-container .markdown-body').forEach((body) => {
    body.setAttribute('data-theme', 'dark');
  });

  document
    .querySelectorAll<HTMLElement>(
      '.emgithub-container .markdown-body .highlight pre, .emgithub-container .code-area pre'
    )
    .forEach((pre) => {
      pre.classList.add('my-code-block');
    });
}

applyEmgithubTheme();

const observer = new MutationObserver(() => {
  applyEmgithubTheme();
});

observer.observe(document.body, { childList: true, subtree: true });
