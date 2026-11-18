/**
 * 宿主半侧：只占一条 Loader 行，让 DSH 把本包的浏览器半侧（client.js）送进工作台。
 * 页面本身不注册任何宿主路由——读写全部复用 dsh-pet 已有的 /config、/pet-appearance、/wechat/*。
 */

export const name = 'studio-pet-settings';

/** @param {import('@deepseek-ai/cordis').Context} ctx */
export function apply(ctx) {
  console.log('[studio-pet-settings] plugin loaded — 设置 → 桌宠已注册');
  ctx.effect(() => () => {
    console.log('[studio-pet-settings] plugin unloaded');
  });
}
