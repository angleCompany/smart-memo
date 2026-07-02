// 인라인 실시간 마크다운 에디터 (contenteditable 블록 모델, ESM)
//
// 에디터는 여러 개의 "블록"(div.md-block)으로 구성된다. 각 블록은 한 줄에 대응하며
// data-md 속성에 타입(p/h1/h2/h3/ul/ol/quote)을 저장한다. 저장 시에는 이 타입과
// textContent로 마크다운 소스를 결정론적으로 직렬화한다(HTML 역파싱 없음 → 안전).
//
// 동작:
//   - Enter: 현재 줄의 마크다운 마커를 해석해 그 줄을 해당 모양으로 변환하고
//            아래에 새 줄을 만든다. (목록은 이어지고, 빈 목록에서 Enter는 목록 종료)
//   - Backspace(줄 맨 앞): 특수 블록이면 문단으로 강등, 문단이면 위 줄과 병합
//   - 붙여넣기: 서식/노드 오염 없이 평문으로 삽입(줄바꿈은 블록으로 분리, 마커도 해석)

import { parseBlock, blockToLine } from '../markdown.js';

/* ===== 블록 생성/판별 ===== */

function makeBlock(type, text, num) {
  const el = document.createElement('div');
  el.className = 'md-block md-' + type;
  el.dataset.md = type;
  if (type === 'ol') el.dataset.num = String(num || 1);
  el.textContent = text || '';
  return el;
}

function applyType(block, type, num) {
  block.className = 'md-block md-' + type;
  block.dataset.md = type;
  if (type === 'ol') block.dataset.num = String(num || 1);
  else block.removeAttribute('data-num');
}

function currentBlock(editorEl) {
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  let node = sel.anchorNode;
  while (node && node !== editorEl) {
    if (node.nodeType === 1 && node.classList && node.classList.contains('md-block')) return node;
    node = node.parentNode;
  }
  return null;
}

/* ===== 캐럿 유틸 ===== */

function placeCaret(el, atStart) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(!!atStart);
  const sel = document.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function setCaretInBlock(block, pos) {
  const range = document.createRange();
  const tn = block.firstChild;
  if (tn && tn.nodeType === 3) {
    range.setStart(tn, Math.max(0, Math.min(pos, tn.textContent.length)));
  } else {
    range.selectNodeContents(block);
    range.collapse(true);
  }
  range.collapse(true);
  const sel = document.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function caretAtBlockStart(block) {
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  if (!range.collapsed) return false;
  const pre = document.createRange();
  pre.selectNodeContents(block);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length === 0;
}

// 블록 내 캐럿(또는 선택)의 앞/뒤 텍스트를 반환. 선택 영역은 버려진다(Enter/붙여넣기가 대체).
function splitBlockAtCaret(block) {
  const sel = document.getSelection();
  const range = sel.getRangeAt(0);
  const before = document.createRange();
  before.selectNodeContents(block);
  before.setEnd(range.startContainer, range.startOffset);
  const after = document.createRange();
  after.selectNodeContents(block);
  after.setStart(range.endContainer, range.endOffset);
  return { before: before.toString(), after: after.toString() };
}

/* ===== 플레이스홀더 ===== */

// 에디터가 "빈 문단 하나"뿐일 때만 플레이스홀더를 표시한다(CSS ::before).
export function refreshEditorPlaceholder(editorEl) {
  const blocks = editorEl.querySelectorAll('.md-block');
  blocks.forEach(b => b.removeAttribute('data-ph'));
  if (blocks.length === 1 && blocks[0].dataset.md === 'p' && !blocks[0].textContent) {
    blocks[0].setAttribute('data-ph', editorEl.dataset.placeholder || '메모를 입력하세요…');
  }
}

/* ===== 마크다운 ↔ 블록 ===== */

export function setMemoMarkdown(editorEl, md) {
  editorEl.innerHTML = '';
  const text = String(md == null ? '' : md);
  const lines = text === '' ? [''] : text.split('\n');
  lines.forEach(line => {
    const b = parseBlock(line);
    editorEl.appendChild(makeBlock(b.type, b.text, b.num));
  });
  if (!editorEl.firstChild) editorEl.appendChild(makeBlock('p', ''));
  refreshEditorPlaceholder(editorEl);
}

export function getMemoMarkdown(editorEl) {
  const lines = [];
  editorEl.querySelectorAll('.md-block').forEach(el => {
    lines.push(blockToLine({
      type: el.dataset.md || 'p',
      text: el.textContent || '',
      num: Number(el.dataset.num) || 1,
    }));
  });
  return lines.join('\n');
}

export function focusEditor(editorEl) {
  editorEl.focus();
  const blocks = editorEl.querySelectorAll('.md-block');
  const last = blocks[blocks.length - 1];
  if (last) placeCaret(last, false);
}

/* ===== 키/붙여넣기 핸들러 ===== */

export function handleEditorKeydown(e, editorEl) {
  if (e.isComposing || e.keyCode === 229) return; // 한글 등 IME 조합 중이면 무시

  if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const block = currentBlock(editorEl);
    if (!block) return;
    e.preventDefault();

    // 캐럿 기준으로 앞/뒤 텍스트 분리(뒤 텍스트는 새 줄로 이동)
    const { before, after } = splitBlockAtCaret(block);
    let curType = block.dataset.md || 'p';

    // Shift+Enter: 변환·목록 이어짐 없이 그냥 문단 줄바꿈
    if (e.shiftKey) {
      block.textContent = before;
      const nb = makeBlock('p', after);
      editorEl.insertBefore(nb, block.nextSibling);
      placeCaret(nb, true);
      refreshEditorPlaceholder(editorEl);
      return;
    }

    // 빈 목록 항목에서 Enter → 목록 종료(문단으로 강등, 새 줄 없음)
    if ((curType === 'ul' || curType === 'ol') && (before + after).trim() === '') {
      applyType(block, 'p');
      block.textContent = '';
      placeCaret(block, true);
      refreshEditorPlaceholder(editorEl);
      return;
    }

    // 현재 줄의 마커를 해석해 아직 문단이면 해당 타입으로 변환(마커 제거)
    const parsed = parseBlock(before);
    if (parsed.type !== 'p' && curType === 'p') {
      curType = parsed.type;
      applyType(block, curType, parsed.num);
      block.textContent = parsed.text;
    } else {
      block.textContent = before;
    }

    // 아래에 새 줄 생성(목록은 이어지고, 그 외는 문단). 캐럿 뒤 텍스트를 옮긴다.
    let nextType = 'p';
    let nextNum;
    if (curType === 'ul') nextType = 'ul';
    else if (curType === 'ol') { nextType = 'ol'; nextNum = (Number(block.dataset.num) || 1) + 1; }
    const next = makeBlock(nextType, after, nextNum);
    editorEl.insertBefore(next, block.nextSibling);
    placeCaret(next, true);
    refreshEditorPlaceholder(editorEl);
    return;
  }

  if (e.key === 'Backspace' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const block = currentBlock(editorEl);
    if (!block || !caretAtBlockStart(block)) return;

    // 특수 블록이면 문단으로 강등(삭제 대신)
    if ((block.dataset.md || 'p') !== 'p') {
      e.preventDefault();
      applyType(block, 'p');
      placeCaret(block, true);
      refreshEditorPlaceholder(editorEl);
      return;
    }
    // 문단이면 위 줄과 병합
    const prev = block.previousElementSibling;
    if (prev && prev.classList.contains('md-block')) {
      e.preventDefault();
      const prevLen = (prev.textContent || '').length;
      prev.textContent = (prev.textContent || '') + (block.textContent || '');
      block.remove();
      setCaretInBlock(prev, prevLen);
      refreshEditorPlaceholder(editorEl);
    }
    // 첫 줄이면 기본 동작 없음
  }
}

export function handleEditorPaste(e, editorEl) {
  e.preventDefault();
  const cd = e.clipboardData || window.clipboardData;
  const text = String(cd ? cd.getData('text/plain') : '').replace(/\r\n?/g, '\n');
  const parts = text.split('\n');

  const block = currentBlock(editorEl);
  if (!block) { // 폴백: 안전하게 뒤에 덧붙임
    setMemoMarkdown(editorEl, getMemoMarkdown(editorEl) + '\n' + text);
    return;
  }

  const { before, after } = splitBlockAtCaret(block);

  if (parts.length === 1) {
    block.textContent = before + parts[0] + after;
    setCaretInBlock(block, (before + parts[0]).length);
  } else {
    block.textContent = before + parts[0];
    let ref = block;
    for (let i = 1; i < parts.length; i++) {
      const isLast = i === parts.length - 1;
      const content = isLast ? parts[i] + after : parts[i];
      const b = parseBlock(content);
      const nb = makeBlock(b.type, b.text, b.num);
      editorEl.insertBefore(nb, ref.nextSibling);
      ref = nb;
    }
    setCaretInBlock(ref, (ref.textContent || '').length - after.length);
  }
  refreshEditorPlaceholder(editorEl);
}
