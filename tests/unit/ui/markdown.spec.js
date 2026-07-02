import { describe, it, expect } from 'vitest';
import {
  parseBlock, blockToLine, renderInline, stripInline, mdToHtml, memoPreview,
} from '../../../src/ui/markdown.js';

describe('parseBlock', () => {
  it('# / ## / ### 를 h1/h2/h3로 파싱하고 마커를 제거', () => {
    expect(parseBlock('# 제목')).toEqual({ type: 'h1', text: '제목' });
    expect(parseBlock('## 제목')).toEqual({ type: 'h2', text: '제목' });
    expect(parseBlock('### 회의 정리')).toEqual({ type: 'h3', text: '회의 정리' });
  });
  it('#### 이상은 제목이 아니라 문단', () => {
    expect(parseBlock('#### 너무 깊음')).toEqual({ type: 'p', text: '#### 너무 깊음' });
  });
  it('- 와 * 를 불릿(ul)으로 파싱', () => {
    expect(parseBlock('- 할 일')).toEqual({ type: 'ul', text: '할 일' });
    expect(parseBlock('* 할 일')).toEqual({ type: 'ul', text: '할 일' });
  });
  it('1. 을 번호 목록(ol)으로 파싱하고 번호를 보존', () => {
    expect(parseBlock('1. 첫째')).toEqual({ type: 'ol', text: '첫째', num: 1 });
    expect(parseBlock('3. 셋째')).toEqual({ type: 'ol', text: '셋째', num: 3 });
  });
  it('> 를 인용으로 파싱', () => {
    expect(parseBlock('> 인용문')).toEqual({ type: 'quote', text: '인용문' });
    expect(parseBlock('>')).toEqual({ type: 'quote', text: '' });
  });
  it('마커 뒤 공백이 없으면 문단으로 취급', () => {
    expect(parseBlock('#제목아님')).toEqual({ type: 'p', text: '#제목아님' });
    expect(parseBlock('*기울임*')).toEqual({ type: 'p', text: '*기울임*' });
  });
  it('일반 텍스트는 문단', () => {
    expect(parseBlock('그냥 메모')).toEqual({ type: 'p', text: '그냥 메모' });
    expect(parseBlock('')).toEqual({ type: 'p', text: '' });
  });
  it('null/undefined 안전 처리', () => {
    expect(parseBlock(null)).toEqual({ type: 'p', text: '' });
    expect(parseBlock(undefined)).toEqual({ type: 'p', text: '' });
  });
});

describe('blockToLine (parseBlock 역변환)', () => {
  it('각 타입을 올바른 마커로 직렬화', () => {
    expect(blockToLine({ type: 'h1', text: '제목' })).toBe('# 제목');
    expect(blockToLine({ type: 'h3', text: '회의' })).toBe('### 회의');
    expect(blockToLine({ type: 'ul', text: '할 일' })).toBe('- 할 일');
    expect(blockToLine({ type: 'ol', text: '둘째', num: 2 })).toBe('2. 둘째');
    expect(blockToLine({ type: 'quote', text: '인용' })).toBe('> 인용');
    expect(blockToLine({ type: 'p', text: '문단' })).toBe('문단');
  });
  it('ol 번호가 없으면 1로', () => {
    expect(blockToLine({ type: 'ol', text: 'x' })).toBe('1. x');
  });
  it('round-trip: parse → serialize → parse 가 안정적', () => {
    const lines = ['# a', '## b', '### c', '- d', '2. e', '> f', 'g'];
    for (const line of lines) {
      expect(blockToLine(parseBlock(line))).toBe(line);
    }
  });
});

describe('renderInline', () => {
  it('HTML 특수문자를 먼저 이스케이프한다(XSS 방지)', () => {
    expect(renderInline('<script>')).toBe('&lt;script&gt;');
    expect(renderInline('a & b')).toBe('a &amp; b');
  });
  it('**굵게** → <strong>', () => {
    expect(renderInline('**중요**')).toBe('<strong>중요</strong>');
  });
  it('*기울임* → <em>', () => {
    expect(renderInline('*강조*')).toBe('<em>강조</em>');
    expect(renderInline('앞 *중간* 뒤')).toBe('앞 <em>중간</em> 뒤');
  });
  it('`코드` → <code> 이고 내부는 이스케이프된다', () => {
    expect(renderInline('`x < y`')).toBe('<code>x &lt; y</code>');
  });
  it('굵게와 기울임이 섞여도 처리', () => {
    expect(renderInline('**굵게** 와 *기울임*')).toBe('<strong>굵게</strong> 와 <em>기울임</em>');
  });
});

describe('stripInline', () => {
  it('인라인 마커를 평문으로 제거', () => {
    expect(stripInline('**굵게** *기울임* `코드`')).toBe('굵게 기울임 코드');
  });
});

describe('mdToHtml', () => {
  it('제목을 h 태그로 렌더링', () => {
    expect(mdToHtml('### 회의 정리')).toBe('<h3>회의 정리</h3>');
  });
  it('연속된 불릿을 하나의 ul로 묶는다', () => {
    expect(mdToHtml('- 하나\n- 둘')).toBe('<ul>\n<li>하나</li>\n<li>둘</li>\n</ul>');
  });
  it('연속된 번호 목록을 하나의 ol로 묶는다', () => {
    expect(mdToHtml('1. 하나\n2. 둘')).toBe('<ol>\n<li>하나</li>\n<li>둘</li>\n</ol>');
  });
  it('ul 과 ol 이 섞이면 목록을 분리', () => {
    expect(mdToHtml('- a\n1. b')).toBe('<ul>\n<li>a</li>\n</ul>\n<ol>\n<li>b</li>\n</ol>');
  });
  it('인용과 문단을 렌더링', () => {
    expect(mdToHtml('> 인용')).toBe('<blockquote>인용</blockquote>');
    expect(mdToHtml('평범한 줄')).toBe('<p>평범한 줄</p>');
  });
  it('빈 줄은 건너뛴다', () => {
    expect(mdToHtml('a\n\nb')).toBe('<p>a</p>\n<p>b</p>');
  });
  it('제목이 목록을 닫는다', () => {
    expect(mdToHtml('- a\n# 제목')).toBe('<ul>\n<li>a</li>\n</ul>\n<h1>제목</h1>');
  });
  it('본문의 HTML을 이스케이프한다(XSS 방지)', () => {
    expect(mdToHtml('# <img src=x onerror=alert(1)>')).toBe('<h1>&lt;img src=x onerror=alert(1)&gt;</h1>');
  });
  it('빈 입력은 빈 문자열', () => {
    expect(mdToHtml('')).toBe('');
    expect(mdToHtml(null)).toBe('');
  });
});

describe('memoPreview', () => {
  it('첫 유효 줄을 제목, 나머지를 설명으로(마커 제거)', () => {
    expect(memoPreview('### 회의 정리\n- 할 일 1\n- 할 일 2')).toEqual({
      title: '회의 정리',
      desc: '할 일 1 할 일 2',
    });
  });
  it('선행 빈 줄을 건너뛴다', () => {
    expect(memoPreview('\n\n# 제목\n내용')).toEqual({ title: '제목', desc: '내용' });
  });
  it('인라인 마커도 제거', () => {
    expect(memoPreview('**굵은 제목**')).toEqual({ title: '굵은 제목', desc: '' });
  });
  it('빈 메모는 빈 값', () => {
    expect(memoPreview('')).toEqual({ title: '', desc: '' });
    expect(memoPreview('   \n  ')).toEqual({ title: '', desc: '' });
  });
});
