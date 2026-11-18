/**
 * 宿主半侧：只占一条 Loader 行，把本包的浏览器半侧送进工作台。
 * 侧边栏底部的「设置」入口完全由 client.js 注册，宿主侧不需要任何路由。
 */

export const name = 'studio-settings-entry';

/** @param {import('@deepseek-ai/cordis').Context} ctx */
export function apply(ctx) {
  console.log('[studio-settings-entry] plugin loaded — 侧边栏底部只留「设置」');
  ctx.effect(() => () => {
    console.log('[studio-settings-entry] plugin unloaded');
  });
}
