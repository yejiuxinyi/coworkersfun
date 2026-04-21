import html2canvas from 'html2canvas';

export async function sharePoster(card) {
  const node = document.querySelector('.card');
  if (!node) {
    alert('未找到卡牌元素');
    return;
  }
  const canvas = await html2canvas(node, { backgroundColor: '#0f0f17', scale: 2 });
  const url = canvas.toDataURL('image/png');

  const a = document.createElement('a');
  a.href = url;
  a.download = `${card.name}-${card.rarity}.png`;
  a.click();
}
