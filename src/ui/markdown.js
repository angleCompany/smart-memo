// 순수 마크다운 파서/직렬화 (외부 의존 없음 · 브라우저 + Vitest 공용, ESM)
//
// 메모는 마크다운 "소스 텍스트"로 저장한다(item.content). 에디터는 이 모듈로
// 각 줄의 블록 타입을 판별해 실시간 변환하고, 저장 시 다시 소스 텍스트로 직렬화한다.
// 상세 보기는 mdToHtml로 렌더링한다.
//
// 지원 범위 (의도적으로 작게 유지):
//   블록: # / ## / ###(제목), -·*(불릿), 1.(번호), >(인용), 그 외(문단)
//   인라인: **굵게**, *기울임*, `코드`
//   (링크는 XSS 표면을 줄이기 위해 v1에서 제외)

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

function esc(str) {
  return String(str == null ? '' : str).replace(/[&<>"]/g, c => ESC[c]);
}

// 한 줄을 블록으로 파싱한다. 반환: { type, text, num? }
// type: 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'quote' | 'p'
export function parseBlock(line) {
  const s = String(line == null ? '' : line);
  let m;
  if ((m = /^(#{1,3})[ \t]+(.*)$/.exec(s))) return { type: 'h' + m[1].length, text: m[2] };
  if ((m = /^[-*][ \t]+(.*)$/.exec(s)))      return { type: 'ul', text: m[1] };
  if ((m = /^(\d+)\.[ \t]+(.*)$/.exec(s)))   return { type: 'ol', text: m[2], num: Number(m[1]) };
  if ((m = /^>[ \t]*(.*)$/.exec(s)))         return { type: 'quote', text: m[1] };
  return { type: 'p', text: s };
}

// 블록을 다시 한 줄의 마크다운 소스로 직렬화한다. parseBlock의 역변환.
export function blockToLine(block) {
  const type = (block && block.type) || 'p';
  const text = block && block.text != null ? String(block.text) : '';
  switch (type) {
    case 'h1':    return '# ' + text;
    case 'h2':    return '## ' + text;
    case 'h3':    return '### ' + text;
    case 'ul':    return '- ' + text;
    case 'ol':    return ((block && block.num) || 1) + '. ' + text;
    case 'quote': return '> ' + text;
    default:      return text;
  }
}

// 인라인 마크다운을 안전한 HTML로 변환한다(먼저 이스케이프 후 패턴 적용).
export function renderInline(text) {
  let s = esc(text);
  s = s.replace(/`([^`]+)`/g, (_, c) => '<code>' + c + '</code>'); // 코드 먼저 보호
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');        // 굵게 (기울임보다 먼저)
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');        // 기울임
  return s;
}

// 인라인 마커만 제거한 평문(목록/카드 미리보기용).
export function stripInline(text) {
  return String(text == null ? '' : text)
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1');
}

// 마크다운 소스 → 안전한 HTML(상세 보기 렌더링용). 연속된 목록은 <ul>/<ol>로 묶는다.
export function mdToHtml(md) {
  const lines = String(md == null ? '' : md).split('\n');
  const out = [];
  let listType = null; // 'ul' | 'ol'
  const closeList = () => {
    if (listType) { out.push(listType === 'ul' ? '</ul>' : '</ol>'); listType = null; }
  };
  for (const line of lines) {
    const b = parseBlock(line);
    if (b.type === 'ul' || b.type === 'ol') {
      if (listType && listType !== b.type) closeList();
      if (!listType) { out.push(b.type === 'ul' ? '<ul>' : '<ol>'); listType = b.type; }
      out.push('<li>' + renderInline(b.text) + '</li>');
      continue;
    }
    closeList();
    if (b.type === 'p') {
      if (b.text.trim() === '') continue; // 빈 줄은 여백(CSS margin)으로 처리
      out.push('<p>' + renderInline(b.text) + '</p>');
    } else if (b.type === 'quote') {
      out.push('<blockquote>' + renderInline(b.text) + '</blockquote>');
    } else {
      const lvl = b.type[1]; // h1/h2/h3 → 1/2/3
      out.push('<h' + lvl + '>' + renderInline(b.text) + '</h' + lvl + '>');
    }
  }
  closeList();
  return out.join('\n');
}

// 목록/카드용 미리보기: 첫 유효 줄을 제목으로, 나머지를 설명으로(마커 제거된 평문).
export function memoPreview(md) {
  const stripped = String(md == null ? '' : md).split('\n').map(l => {
    const b = parseBlock(l);
    return stripInline(b.text).trim();
  });
  const firstIdx = stripped.findIndex(t => t !== '');
  if (firstIdx === -1) return { title: '', desc: '' };
  const title = stripped[firstIdx];
  const desc = stripped.slice(firstIdx + 1).filter(Boolean).join(' ');
  return { title, desc };
}
