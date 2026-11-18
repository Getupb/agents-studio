/**
 * 工作台「设置 → 桌宠」页：显示调节 + 微信渠道，两段折叠分区。
 *
 * 浏览器半侧，注册进 DSH 设置的 `settings.section` 一级导航；不读配置文件、不自己拼路径，
 * 所有读写都走 dsh-pet 已有的宿主路由（GET /config、POST /pet-appearance、/wechat/*），
 * 这样桌面 Helper 与网页看到的永远是同一份配置。
 *
 * 这里是手写的模块加载器格式（与构建产物一致）：DSH 的浏览器模块系统按
 * /plugins/studio-pet-settings/client.js 取它，`require` 由宿主提供。
 */
window.__ModuleLoader__.load({
  id: 'studio-pet-settings',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const React = require('react');
    const h = React.createElement;

    /** 桌宠插件的路由前缀：与 shared/constants 的 ROUTE_SEGMENT 一致。 */
    const PET_BASE = '/dsh-pet-7340';
    /** 本页只调这一只（Agents Studio 只有一只 Helper）。 */
    const PET_ID = 'main';
    const CORNERS = [
      ['bottom-left', '左下'],
      ['bottom-right', '右下'],
      ['top-left', '左上'],
      ['top-right', '右上'],
    ];
    const SIZE_MIN = 100;
    const SIZE_MAX = 1000;

    const color = {
      muted: 'rgba(128,128,128,0.9)',
      line: 'rgba(128,128,128,0.3)',
      soft: 'rgba(128,128,128,0.08)',
      ok: '#2f9e44',
      bad: '#e03131',
    };
    const card = { border: '1px solid ' + color.line, borderRadius: 10, padding: '16px 18px', marginBottom: 16 };
    const labelStyle = { fontSize: 13, color: color.muted, marginBottom: 6, display: 'block' };
    const buttonStyle = {
      border: '1px solid ' + color.line,
      background: color.soft,
      borderRadius: 8,
      padding: '6px 14px',
      fontSize: 13,
      cursor: 'pointer',
      color: 'inherit',
    };

    /** 错误 → 一句话（fetch 抛的 Error 或别的值）。 */
    function msg(e) {
      return e && e.message ? e.message : String(e);
    }

    /** 读 JSON；非 2xx 抛错（错误文案取服务端 message，取不到就给状态码）。 */
    async function getJson(path) {
      const res = await fetch(path, { cache: 'no-store' });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error((body && (body.message || body.error)) || 'HTTP ' + res.status);
      return body;
    }

    /** 写 JSON：POST 到桌宠端点，失败把服务端 message 抛给调用方。 */
    async function postJson(path, payload) {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload || {}),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error((body && (body.message || body.error)) || 'HTTP ' + res.status);
      if (body && body.ok === false) throw new Error(body.message || '请求被拒绝');
      return body;
    }

    /** 配置里的宠物段 → 本页表单值（缺字段时给安全默认）。
     *  /config 回的是 {"main":{...,"pets":[{id:"main",size,position,...}]}}：外观字段在 pets[] 里，
     *  不在 main 顶层，所以先按 id 找实例，找不到才退回顶层。 */
    function readForm(cfg) {
      const root = (cfg && cfg[PET_ID]) || {};
      const list = Array.isArray(root.pets) ? root.pets : [];
      const pet = list.find((p) => p && p.id === PET_ID) || root;
      const pos = pet.position || {};
      return {
        size: typeof pet.size === 'number' ? pet.size : 300,
        corner: typeof pos.corner === 'string' ? pos.corner : 'bottom-left',
        marginX: typeof pos.marginX === 'number' ? pos.marginX : 0,
        marginY: typeof pos.marginY === 'number' ? pos.marginY : 0,
        fixedEnabled: pet.fixedEnabled === true,
      };
    }

    /** 一行「标签 + 控件」。 */
    function Field(props) {
      return h(
        'div',
        { style: { marginBottom: 14 } },
        h('label', { style: labelStyle }, props.label),
        props.children,
        props.hint ? h('div', { style: { fontSize: 12, color: color.muted, marginTop: 4 } }, props.hint) : null,
      );
    }

    /** 只读状态行。 */
    function Info(props) {
      return h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13, padding: '6px 0', borderBottom: '1px solid ' + color.soft } },
        h('span', { style: { color: color.muted } }, props.label),
        h('span', { style: { textAlign: 'right', wordBreak: 'break-all' } }, props.value),
      );
    }

    /** 设置页内容：两段分区，各自带自己的保存动作。 */
    function PetSettingsSection() {
      const [form, setForm] = React.useState(null);
      const [loadError, setLoadError] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [notice, setNotice] = React.useState('');
      const [status, setStatus] = React.useState(null);
      const [statusError, setStatusError] = React.useState('');
      const [qr, setQr] = React.useState(null);
      const [pendingQr, setPendingQr] = React.useState('');
      const [pendingVerify, setPendingVerify] = React.useState('');

      const refreshStatus = React.useCallback(async () => {
        try {
          const next = await getJson(PET_BASE + '/wechat/status');
          setStatus(next);
          setStatusError('');
        } catch (e) {
          setStatusError(msg(e));
        }
      }, []);

      React.useEffect(() => {
        let alive = true;
        (async () => {
          try {
            const cfg = await getJson(PET_BASE + '/config');
            if (alive) setForm(readForm(cfg));
          } catch (e) {
            if (alive) setLoadError(msg(e));
          }
          await refreshStatus();
        })();
        const timer = window.setInterval(refreshStatus, 5000);
        return () => {
          alive = false;
          window.clearInterval(timer);
        };
      }, [refreshStatus]);

      // 扫码：拿到状态就停，确认后刷一次连接状态
      React.useEffect(() => {
        if (pendingQr === '') return;
        const timer = window.setInterval(async () => {
          try {
            const res = await getJson(PET_BASE + '/wechat/login/status' + (pendingVerify === '' ? '' : '?verifyCode=' + encodeURIComponent(pendingVerify)));
            const s = String(res.status || '');
            if (s === 'confirmed') {
              window.clearInterval(timer);
              setPendingQr('');
              setQr(null);
              setPendingVerify('');
              setNotice('微信渠道已连接');
              await refreshStatus();
            } else if (s === 'expired' || s === 'none') {
              window.clearInterval(timer);
              setPendingQr('');
              setQr(null);
              setNotice(s === 'expired' ? '二维码已过期，请重新生成' : '扫码会话已结束');
            } else if (res.message) {
              setNotice(String(res.message));
            }
          } catch (e) {
            // 轮询失败不打断：下一次继续（网络抖动而已）
          }
        }, 2000);
        return () => window.clearInterval(timer);
      }, [pendingQr, pendingVerify, refreshStatus]);

      const set = (patch) => setForm((prev) => (prev === null ? prev : Object.assign({}, prev, patch)));

      const saveAppearance = async () => {
        if (form === null) return;
        setBusy(true);
        setNotice('');
        try {
          const cfg = await postJson(PET_BASE + '/pet-appearance', {
            id: PET_ID,
            size: form.size,
            position: { corner: form.corner, marginX: form.marginX, marginY: form.marginY },
            fixedEnabled: form.fixedEnabled,
          });
          setForm(readForm(cfg));
          setNotice('已保存，桌宠正在重启以应用新的大小与位置');
        } catch (e) {
          setNotice('保存失败：' + msg(e));
        } finally {
          setBusy(false);
        }
      };

      const startLogin = async () => {
        setNotice('');
        try {
          const res = await postJson(PET_BASE + '/wechat/login');
          setQr(String(res.qrcodeUrl || ''));
          setPendingQr(String(res.qrcodeUrl || ''));
          setPendingVerify('');
          if (!res.qrcodeUrl) setNotice('没有拿到二维码地址');
        } catch (e) {
          setNotice('生成二维码失败：' + msg(e));
        }
      };

      const logout = async () => {
        if (!window.confirm('断开后需要重新扫码登录微信，确定断开？')) return;
        setNotice('');
        try {
          await postJson(PET_BASE + '/wechat/logout');
          setQr(null);
          setPendingQr('');
          setNotice('已断开微信渠道');
          await refreshStatus();
        } catch (e) {
          setNotice('断开失败：' + msg(e));
        }
      };

      if (loadError !== '') {
        return h('div', { style: { fontSize: 13, color: color.bad } }, '读取桌宠配置失败：' + loadError);
      }
      if (form === null) {
        return h('div', { style: { fontSize: 13, color: color.muted } }, '正在读取桌宠配置…');
      }

      return h(
        'div',
        { style: { maxWidth: 680 } },
        h('div', { style: { fontSize: 13, color: color.muted, marginBottom: 16 } },
          '这里改的是桌宠 Helper 自己的配置（.dsh-home/dsh-pet-only/main-config.jsonc），保存后会重启一次桌宠。'),
        notice !== '' ? h('div', { style: { fontSize: 13, marginBottom: 12, color: notice.indexOf('失败') >= 0 ? color.bad : color.ok } }, notice) : null,

        // ---- 显示调节 ----
        h('div', { style: card },
          h('div', { style: { fontSize: 15, fontWeight: 600, marginBottom: 4 } }, '显示调节'),
          h('div', { style: { fontSize: 12, color: color.muted, marginBottom: 14 } }, '大小与位置决定桌宠在屏幕上的占位；改完点保存生效。'),
          h(Field, { label: '大小：' + form.size + ' px' },
            h('input', {
              type: 'range', min: SIZE_MIN, max: SIZE_MAX, step: 1, value: form.size,
              onChange: (e) => set({ size: Number(e.target.value) }),
              style: { width: '100%' },
            }),
          ),
          h(Field, { label: '贴角位置' },
            h('select', {
              value: form.corner,
              onChange: (e) => set({ corner: e.target.value }),
              style: { padding: '6px 10px', borderRadius: 8, border: '1px solid ' + color.line, background: 'transparent', color: 'inherit' },
            }, CORNERS.map(([id, text]) => h('option', { key: id, value: id }, text))),
          ),
          h(Field, { label: '边距', hint: '离所选角的像素距离' },
            h('div', { style: { display: 'flex', gap: 10 } },
              h('input', {
                type: 'number', min: 0, max: 1000, value: form.marginX,
                onChange: (e) => set({ marginX: Number(e.target.value) }),
                style: { width: 100, padding: '6px 8px', borderRadius: 8, border: '1px solid ' + color.line, background: 'transparent', color: 'inherit' },
              }),
              h('span', { style: { alignSelf: 'center', fontSize: 12, color: color.muted } }, 'X'),
              h('input', {
                type: 'number', min: 0, max: 1000, value: form.marginY,
                onChange: (e) => set({ marginY: Number(e.target.value) }),
                style: { width: 100, padding: '6px 8px', borderRadius: 8, border: '1px solid ' + color.line, background: 'transparent', color: 'inherit' },
              }),
              h('span', { style: { alignSelf: 'center', fontSize: 12, color: color.muted } }, 'Y'),
            ),
          ),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16 } },
            h('input', {
              type: 'checkbox', checked: form.fixedEnabled,
              onChange: (e) => set({ fixedEnabled: e.target.checked }),
            }),
            '固定在桌面（不随其它窗口层级变化）',
          ),
          h('button', { type: 'button', style: buttonStyle, disabled: busy, onClick: saveAppearance },
            busy ? '保存中…' : '保存显示调节'),
        ),

        // ---- 微信渠道 ----
        h('div', { style: card },
          h('div', { style: { fontSize: 15, fontWeight: 600, marginBottom: 4 } }, '微信渠道'),
          h('div', { style: { fontSize: 12, color: color.muted, marginBottom: 14 } },
            '扫码绑定后，微信里发消息就能直接和这只桌宠对话；状态每 5 秒刷新一次。'),
          statusError !== '' ? h('div', { style: { fontSize: 12, color: color.bad, marginBottom: 8 } }, '状态读取失败：' + statusError) : null,
          status === null
            ? h('div', { style: { fontSize: 13, color: color.muted } }, '正在读取渠道状态…')
            : h('div', { style: { marginBottom: 12 } },
                h(Info, { label: '连接状态', value: status.connected ? '已连接' : '未连接' }),
                h(Info, { label: '运行中', value: status.running ? '是' : '否' }),
                status.botId ? h(Info, { label: '机器人 ID', value: status.botId }) : null,
                status.baseUrl ? h(Info, { label: '服务地址', value: status.baseUrl }) : null,
                status.userId ? h(Info, { label: '已配对用户', value: status.userId }) : null,
              ),
          h('div', { style: { display: 'flex', gap: 10, marginTop: 6 } },
            h('button', { type: 'button', style: buttonStyle, onClick: startLogin },
              status && status.connected ? '重新扫码绑定' : '扫码绑定微信'),
            h('button', { type: 'button', style: buttonStyle, onClick: logout, disabled: !(status && status.connected) }, '断开连接'),
          ),
          qr !== null && qr !== ''
            ? h('div', { style: { marginTop: 14, textAlign: 'center' } },
                h('div', { style: { fontSize: 12, color: color.muted, marginBottom: 8 } }, '用手机微信扫码（5 分钟内有效）：'),
                h('img', { src: qr, alt: '微信登录二维码', style: { width: 200, height: 200, imageRendering: 'pixelated' } }),
              )
            : null,
          pendingVerify === '' && qr !== null && qr !== ''
            ? h('div', { style: { marginTop: 10, fontSize: 12, color: color.muted } }, '扫描后请在手机上确认；若微信提示配对码，按提示操作即可。')
            : null,
        ),
      );
    }

    /** cordis 纤维依赖：只要 slots 服务（注册设置分区）。 */
    exports.inject = ['slots'];

    /**
     * 浏览器半侧入口：把「桌宠」注册成设置页的一级导航分区。
     * @param ctx - 浏览器插件上下文。
     */
    exports.apply = (ctx) => {
      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          {
            name: 'settings.section',
            id: 'pet',
            order: 40,
            label: () => '桌宠',
          },
          PetSettingsSection,
        ),
      );
    };

    return module.exports;
  },
});
