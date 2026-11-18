/**
 * 宿主半侧：只占一条 Loader 行，把本包的浏览器半侧送进工作台。
 * 品牌字样完全由 client.js 注册，宿主侧不需要任何路由或配置。
 */

export const name = 'studio-brand';

/** @param {import('@deepseek-ai/cordis').Context} ctx */
export function apply(ctx) {
  console.log('[studio-brand] plugin loaded — 左上角换成 Agents Studio 文字标记');
  ctx.effect(() => () => {
    console.log('[studio-brand] plugin unloaded');
  });
}
