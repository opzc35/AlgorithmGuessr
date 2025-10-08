// ==UserScript==
// @name         Algorithm Guessr 守护脚本
// @namespace    https://algorithm-guessr.opzc35.workers.dev/
// @version      1.0.0
// @description  校验选手已安装平台要求的脚本并在 Codeforces/VJudge 页面隐藏题目标签
// @match        https://algorithm-guessr.opzc35.workers.dev/*
// @match        https://codeforces.com/problemset*
// @match        https://codeforces.com/contest/*/problem/*
// @match        https://codeforces.com/edu/course/*/lesson/*/practice
// @match        https://codeforces.com/gym/*
// @match        https://vjudge.net/problem/*
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const API_BASE = 'https://algorithm-guessr.opzc35.workers.dev';
  const VERIFY_ENDPOINT = `${API_BASE}/api/extension/verify`;
  const VERIFY_INTERVAL = 60 * 1000;
  const TAG_TEXT_PATTERNS = [/\bTags?\b/i, /标签[:：]?/];
  const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

  function getToken() {
    try {
      if (pageWindow && pageWindow.localStorage) {
        const token = pageWindow.localStorage.getItem('alg_guessr_token');
        if (token) return token;
      }
      return null;
    } catch (err) {
      console.warn('Algorithm Guessr 脚本无法读取 token', err);
      return null;
    }
  }

  async function sendVerification() {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(VERIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ installed: true }),
        credentials: 'omit',
        mode: 'cors',
      });
      pageWindow.dispatchEvent(new CustomEvent('algGuessrExtensionVerified'));
    } catch (err) {
      console.warn('Algorithm Guessr 验证请求失败', err);
    }
  }

  function scheduleVerification() {
    sendVerification();
    setInterval(sendVerification, VERIFY_INTERVAL);
  }

  function removeElements(selectors) {
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        node.remove();
      });
    });
  }

  function scrubTextHints(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const toClear = [];
    while (walker.nextNode()) {
      const value = walker.currentNode.nodeValue;
      if (!value) continue;
      if (TAG_TEXT_PATTERNS.some((pattern) => pattern.test(value))) {
        toClear.push(walker.currentNode);
      }
    }
    toClear.forEach((node) => {
      node.nodeValue = '';
    });
  }

  function hideCodeforcesTags() {
    removeElements(['.tag-box', 'td.tags', '.datatable td:nth-child(4) .notice']);
    document.querySelectorAll('td.tags').forEach((cell) => {
      cell.textContent = '';
    });
    document.querySelectorAll('.roundbox.sidebox').forEach((box) => {
      if (/Tags?/i.test(box.innerText)) {
        box.remove();
      }
    });
  }

  function hideVjudgeTags() {
    removeElements(['#tag-list', '.tag-list', '.label-info.tag', '.problem-tags', '.tags']);
    document.querySelectorAll('[data-tags]').forEach((node) => {
      node.removeAttribute('data-tags');
    });
  }

  function removeTagHints() {
    if (location.host.includes('codeforces.com')) {
      hideCodeforcesTags();
    }
    if (location.host.includes('vjudge.net')) {
      hideVjudgeTags();
    }
    scrubTextHints(document.body);
  }

  function observeTagRemoval() {
    removeTagHints();
    const observer = new MutationObserver(() => removeTagHints());
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (location.origin === API_BASE) {
    scheduleVerification();
    pageWindow.addEventListener('storage', (event) => {
      if (event.key === 'alg_guessr_token') {
        setTimeout(sendVerification, 500);
      }
    });
    pageWindow.addEventListener('algGuessrExtensionCheck', () => {
      sendVerification();
    });
  } else if (location.host.includes('codeforces.com') || location.host.includes('vjudge.net')) {
    observeTagRemoval();
  }
})();
