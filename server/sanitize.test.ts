import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { escapeHtml, sanitizeUrl } from '../server/sanitize.ts';

describe('escapeHtml', () => {
  it('escapes dangerous characters', () => {
    assert.equal(
      escapeHtml(`<script>alert("x")</script>&'`),
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;'
    );
  });

  it('handles nullish values', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
  });
});

describe('sanitizeUrl', () => {
  it('allows http and https', () => {
    assert.equal(sanitizeUrl('https://electriapp.example/projects'), 'https://electriapp.example/projects');
    assert.equal(sanitizeUrl('http://localhost:3000/projects'), 'http://localhost:3000/projects');
  });

  it('rejects javascript and malformed URLs', () => {
    assert.equal(sanitizeUrl('javascript:alert(1)'), '#');
    assert.equal(sanitizeUrl('not a url'), '#');
    assert.equal(sanitizeUrl(''), '#');
  });
});
