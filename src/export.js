import { pastamirror } from './main.js';
import { getSession } from './session.js';
import { nudelToast } from './toast.js';
import { createShortNameFromSongData } from './song.js';
import { unicodeToBase64 } from '@strudel/core';
import { nudelConfirm } from './confirm.js';

const exportButton = document.querySelector('#export-button');
const exportDialog = document.querySelector('#export-dialog');
const exportCloseButton = document.querySelector('#export-close-button');

const exportCopyButton = document.querySelector('#export-copy-button');
const exportDownloadButton = document.querySelector('#export-download-button');
const exportOpenFlokButton = document.querySelector('#export-open-flok-button');
const exportOpenStrudelButton = document.querySelector('#export-open-strudel-button');
const exportOpenHydraButton = document.querySelector('#export-open-hydra-button');
const exportCopyHydraButton = document.querySelector('#export-copy-hydra-button');
const exportNudelButton = document.querySelector('#export-nudel-button');
const exportShortNudelButton = document.querySelector('#export-short-nudel-button');

if (!exportButton) throw new Error('export button not found');
exportButton.addEventListener('click', () => {
  exportDialog?.showModal();
  if (!exportOpenFlokButton) throw new Error('Open in flok button not found');
  exportOpenFlokButton.href = `https://${getFlokLink()}`;
  exportCloseButton?.focus();
});

let stdSource = '';
fetch('assets/std-min.js').then(async (response) => {
  if (!response.ok) {
    console.error('Failed to load stdSource');
    return;
  }
  stdSource = await response.text();
});

export function getStdSource() {
  return stdSource;
}

// Return the lines of a panel view.
function getDocumentText(view) {
  const doc = view.viewState.state.doc;
  return doc.children ? doc.children.flatMap((c) => c.text) : doc.text;
}

export function getFlokLink() {
  const prettyDate = getPrettyDate();
  const prefix = `// "nudel ${prettyDate}" @by pastagang\n`;

  const panels = [];
  const targets = [];
  pastamirror.currentEditors.forEach((it, key) => {
    panels.push(
      `${key == '1' ? prefix : ''}${getDocumentText(it.view).join('\n')}${key === '1' ? '\n\n\n' + stdSource : ''}`,
    );
    targets.push(it.doc.target);
  });
  return `flok.cc#targets=${targets.join(
    ',',
  )}&${panels.map((it, index) => `c${index}=${btoa(unescape(encodeURIComponent(it)))}`).join('&')}`;
}

export function copyToClipboard(txt, { message }) {
  // Copy to the clipboard
  navigator.clipboard.writeText(txt);
  if (message) {
    nudelToast(`Copied ${message} to clipboard!`);
  } else {
    nudelToast('Copied to clipboard!');
  }
}

export function getPrettyDate() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

export function downloadAsFile(txt, { fileName = `nudel-export-${getPrettyDate()}.js` } = {}) {
  // Download file
  var hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:attachment/text,' + encodeURI(txt);
  hiddenElement.target = '_blank';
  hiddenElement.download = fileName;
  hiddenElement.click();
}

export async function getCode(filter) {
  const prettyDate = getPrettyDate();
  let headline = `// "nudel ${prettyDate}" @by pastagang\n`;

  if (filter != null) {
    headline += '\n';
    headline += `// See this in nudel: ${await createShortNudelLink()}`;
  }
  let documents = getSession().getDocuments();
  if (filter) {
    documents = documents.filter(filter);
  }
  return (
    documents.reduce((acc, doc) => `${acc}\n//pane ${doc.id}\n${doc.content || ''}`, headline) + '\n\n\n' + stdSource
  );
}

// Array<{type: string, content: string}>
export function getSongData() {
  const documents = getSession().getDocuments();
  return documents.map((doc) => ({ type: doc.target, content: doc.content ?? '' }));
}

exportCopyButton?.addEventListener('click', async () => {
  const txt = await getCode();
  copyToClipboard(txt, { message: 'code' });
});

exportDownloadButton?.addEventListener('click', async () => {
  const txt = await getCode();
  downloadAsFile(txt);
});

function code2hash(code) {
  return encodeURIComponent(unicodeToBase64(code));
}

exportOpenStrudelButton?.addEventListener('click', async () => {
  if (
    !(await nudelConfirm(
      'Are you sure you want to only share the audio? Consider sharing a nudel song link instead, as to capture both visuals and audio!',
    ))
  ) {
    return;
  }
  const code = await getCode((doc) => doc.target === 'strudel');
  window.open(`https://strudel.cc/#${code2hash(code)}`);
});

exportOpenHydraButton?.addEventListener('click', async () => {
  if (
    !(await nudelConfirm(
      'Are you sure you want to only share the visuals? consider sharing a nudel song link instead, as to capture both visuals and audio!',
    ))
  ) {
    return;
  }
  const code = await getCode((doc) => doc.target === 'hydra');
  window.open(`https://hydra.ojack.xyz/?code=${code2hash(code)}`);
});

exportCopyHydraButton?.addEventListener('click', async () => {
  if (
    !(await nudelConfirm(
      'Are you sure you want to only share the visuals? consider sharing a nudel song link instead, as to capture both visuals and audio!',
    ))
  ) {
    return;
  }
  const code = await getCode((doc) => doc.target === 'hydra');
  copyToClipboard(code, { message: 'hydra code' });
});

exportNudelButton?.addEventListener('click', () => {
  const songData = getSongData();
  const songDataStr = encodeURIComponent(unicodeToBase64(JSON.stringify(songData)));

  const url = `https://nudel.cc/s?v=${songDataStr}`;
  copyToClipboard(url, { message: 'nudel song link' });
});

async function createShortNudelLink() {
  const songData = getSongData();

  const name = await createShortNameFromSongData(songData);
  return `https://nudel.cc/s?r=${name}`;
}

exportShortNudelButton?.addEventListener('click', async () => {
  const url = await createShortNudelLink();
  copyToClipboard(url, { message: 'nudel short song link' });
});
