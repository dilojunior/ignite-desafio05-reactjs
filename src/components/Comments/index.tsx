import { useEffect } from 'react';

export default function Comments(): JSX.Element {
  useEffect(() => {
    const element = document.getElementById('comments');
    const scriptEl = document.createElement('script');
    scriptEl.setAttribute('src', 'https://utteranc.es/client.js');
    scriptEl.setAttribute('crossOrigin', 'anonymous');
    scriptEl.setAttribute('async', 'true');
    scriptEl.setAttribute(
      'repo',
      'dilojunior/ignite-desafio05-reactjs-comemnts'
    );
    scriptEl.setAttribute('issue-term', 'pathname');
    scriptEl.setAttribute('theme', 'github-dark');
    element.appendChild(scriptEl);
  }, []);

  return <div id="comments" />;
}
