import { toPng } from 'html-to-image';

export async function downloadNodeAsPng(node, filename = 'curematics-business-model-atlas.png') {
  if (!node) throw new Error('No graphic node found to export.');
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#07111f'
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function copyToClipboard(value) {
  await navigator.clipboard.writeText(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
}
