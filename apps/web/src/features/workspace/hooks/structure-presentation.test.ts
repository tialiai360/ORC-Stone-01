import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DetectedModule } from '../pdf/plugins/types';
import {
  isIsolateActive,
  isItemVisibleInPresentation,
  type ModulePresentationMap,
} from './use-structure-presentation';

function applyIsolate(
  modules: DetectedModule[],
  isolatedId: string | null,
  baseVisible: Record<string, boolean>,
): ModulePresentationMap {
  const out = {} as ModulePresentationMap;
  for (const m of modules) {
    const base = baseVisible[m.moduleId] ?? true;
    if (isolatedId) {
      const on = m.moduleId === isolatedId;
      out[m.moduleId] = { visible: on, highlight: on, focus: on };
    } else {
      out[m.moduleId] = { visible: base, highlight: false, focus: false };
    }
  }
  return out;
}

describe('structure presentation isolate rules', () => {
  const detected = [
    {
      moduleId: 'signature',
      labelVi: 'Chữ ký',
      regionCount: 1,
      pageNumbers: [1],
      actionable: true,
    },
    {
      moduleId: 'footer',
      labelVi: 'Cuối trang',
      regionCount: 2,
      pageNumbers: [1],
      actionable: true,
    },
    {
      moduleId: 'rotated-text',
      labelVi: 'Chữ xoay',
      regionCount: 1,
      pageNumbers: [1],
      actionable: true,
    },
  ] as DetectedModule[];

  it('isolate hides every module except target', () => {
    const st = applyIsolate(detected, 'signature', {
      signature: true,
      footer: true,
      'rotated-text': true,
    });
    assert.equal(st.signature?.visible, true);
    assert.equal(st.signature?.highlight, true);
    assert.equal(st.footer?.visible, false);
    assert.equal(st['rotated-text']?.visible, false);
    assert.equal(isIsolateActive(st), true);
  });

  it('in isolate mode untagged body text is hidden', () => {
    const st = applyIsolate(detected, 'signature', {
      signature: true,
      footer: true,
      'rotated-text': true,
    });
    assert.equal(isItemVisibleInPresentation(st, undefined), false);
    assert.equal(isItemVisibleInPresentation(st, 'signature'), true);
    assert.equal(isItemVisibleInPresentation(st, 'footer'), false);
  });

  it('clear isolate restores base visibility for body', () => {
    const st = applyIsolate(detected, null, {
      signature: true,
      footer: false,
      'rotated-text': true,
    });
    assert.equal(st.signature?.visible, true);
    assert.equal(st.footer?.visible, false);
    assert.equal(st.signature?.focus, false);
    assert.equal(isItemVisibleInPresentation(st, undefined), true);
  });
});
