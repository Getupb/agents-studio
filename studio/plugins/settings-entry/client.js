/**
 * 侧边栏左下角只留「设置」。
 *
 * 做法：占住设置外壳的 `settings.launcher` 席位（单席位），用一行「设置」替换自带的
 * 「更多」账号菜单——不再有下拉菜单，点一下直接开设置面板。宿主半侧不参与，账号插件
 * 自身仍照常加载（设置页里的账号分区、登录弹窗等不受影响，只是侧边栏不再有菜单入口）。
 *
 * 这里是手写的模块加载器格式（与构建产物一致），`require` 由宿主提供。
 */
window.__ModuleLoader__.load({
  id: 'studio-settings-entry',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const React = require('react');
    const h = React.createElement;

    /** 行样式：几何尺寸与配色都借用侧边栏自己的变量，看起来就是原生的一行。 */
    const ROW_CSS = `
[data-studio-settings-row] {
  display: flex; align-items: center; gap: 8px; width: 100%; height: 32px;
  padding: 6px calc(var(--dsh-sidebar-row-padding) - var(--dsh-sidebar-paint-inset));
  border: 0; border-inline: var(--dsh-sidebar-paint-inset) solid transparent;
  box-sizing: border-box; border-radius: var(--dsw-radius-md);
  background: transparent; background-clip: padding-box;
  color: var(--dsw-alias-label-primary); font: inherit; font-size: 14px; cursor: pointer;
}
[data-studio-settings-row]:hover { background-color: var(--dsw-alias-interactive-bg-hover); }
[data-studio-settings-row][data-rail='true'] { width: 36px; height: 36px; justify-content: center; padding: 0; border-inline: 0; }
[data-studio-settings-row] > span[data-label] { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
[data-studio-settings-row] svg { flex: none; }
`;

    /** 一次性把行样式挂进文档（插件板卸载时不移除，样式是纯静态的）。 */
    function ensureStyle() {
      if (document.getElementById('studio-settings-entry-style')) return;
      const style = document.createElement('style');
      style.id = 'studio-settings-entry-style';
      style.textContent = ROW_CSS;
      document.head.appendChild(style);
    }

    /** 齿轮图标（14px，与侧边栏其它行同尺寸）。 */
    function GearIcon() {
      return h(
        'svg',
        { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' },
        h('path', {
          d: 'M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 1 0 0-7.2Z',
          stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M19.1 13.7a7.6 7.6 0 0 0 0-3.4l1.7-1.3-1.8-3.1-2 .8a7.6 7.6 0 0 0-2.9-1.7L13.6 3h-3.2l-.3 2.1a7.6 7.6 0 0 0-2.9 1.7l-2-.8L3.3 9l1.7 1.3a7.6 7.6 0 0 0 0 3.4L3.3 15l1.8 3.1 2-.8a7.6 7.6 0 0 0 2.9 1.7l.3 2.1h3.2l.3-2.1a7.6 7.6 0 0 0 2.9-1.7l2 .8 1.8-3.1-1.6-1.3Z',
          stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
        }),
      );
    }

    /** 侧边栏底部的一行：图标 + 「设置」，点开设置面板。 */
    function SettingsRow(props) {
      const wide = props.wide !== false;
      const openSettings = props.openSettings;
      return h(
        'button',
        {
          type: 'button',
          'data-studio-settings-row': 'true',
          'data-rail': wide ? 'false' : 'true',
          'aria-label': '设置',
          'aria-keyshortcuts': props.settingsShortcut && props.settingsShortcut.aria,
          'aria-haspopup': 'dialog',
          'aria-expanded': props.settingsOpen === true,
          onClick: () => {
            if (typeof openSettings === 'function') openSettings();
          },
        },
        h(GearIcon),
        wide ? h('span', { 'data-label': 'true' }, '设置') : null,
      );
    }

    /** cordis 纤维依赖：只要 slots 服务（抢占 launcher 席位）。 */
    exports.inject = ['slots'];

    /**
     * 浏览器半侧入口：用「设置」一行占住侧边栏底部的 launcher 席位。
     * @param ctx - 浏览器插件上下文。
     */
    exports.apply = (ctx) => {
      ensureStyle();
      // priority 取最小值：单席位里 lowest 渲染，这样无论账号插件何时注册，这一行都压在它上面。
      ctx.slots.inject('settings.launcher', () =>
        ctx.slots.register({ name: 'settings.launcher', priority: -1 }, SettingsRow),
      );
    };

    return module.exports;
  },
});
