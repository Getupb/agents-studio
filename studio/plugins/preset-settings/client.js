/**
 * 工作台「设置 → Agent 预设」页：唯一默认模式的可配置面板。
 *
 * 页面只负责编辑 studio/profile/preset-settings.json：
 * 人设、显示名、工具边界开关、高级工具清单、微信渠道裁剪。
 * 保存后宿主重跑 build-zero-preset.mjs 生成 default-preset.yml；预设是启动期加载的，
 * 因此页面提供「保存并重启」让改动立刻生效。
 *
 * 手写模块加载器格式，与其它 studio 浏览器插件一致。
 */
window.__ModuleLoader__.load({
  id: 'studio-preset-settings',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const React = require('react');
    const h = React.createElement;
    const BASE = '/studio-preset';

    const color = {
      muted: 'rgba(128,128,128,0.9)',
      line: 'rgba(128,128,128,0.3)',
      soft: 'rgba(128,128,128,0.08)',
      ok: '#2f9e44',
      bad: '#e03131',
      disabled: 'rgba(128,128,128,0.5)',
    };
    const card = { border: '1px solid ' + color.line, borderRadius: 10, padding: '16px 18px', marginBottom: 16 };
    const labelStyle = { fontSize: 13, color: color.muted, marginBottom: 6, display: 'block' };
    const buttonStyle = {
      border: '1px solid ' + color.line,
      background: color.soft,
      borderRadius: 8,
      padding: '7px 16px',
      fontSize: 13,
      cursor: 'pointer',
      color: 'inherit',
    };

    /** 顶层条目的中文名：只用于开关列表，不暴露包名。 */
    const ENTRY_LABELS = {
      persona: '人设',
      'agent-instructions': '项目约定（AGENTS.md）',
      'time-context': '时间上下文',
      'tool-bash': 'Bash 终端',
      'tool-pwsh': 'PowerShell 终端',
      'tool-fs': '文件读写',
      'tool-fs-search': '文件搜索',
      'tool-jobs': '后台任务',
      'tool-schedule': '定时任务',
      'skill-filesystem': '技能文件',
      'tool-skill': '技能调用',
      'command-goal': '目标命令',
      'tool-goal': '目标工具',
      planning: '计划模式',
      compaction: '上下文压缩',
      delegation: '子代理',
      'tool-ask-user': '向用户提问',
      'tool-todo': '待办',
      'tool-web': '联网搜索与抓取',
      'tool-executor-ptc': '批量执行器',
      'tool-cordis': '插件编写',
      present: '交付展示',
      'tool-plugin-manager': '插件管理',
      'tool-plugin-market': '插件市场',
      'tool-workflow': '工作流',
      'workflow-ptc': 'PTC 工作流',
    };

    /** 能力边界分组：开关按组操作，避免让用户逐个认工具 id。 */
    const GROUPS = [
      { id: 'files', label: '文件读写', desc: '读写与搜索工作区文件', tools: ['tool-fs', 'tool-fs-search'] },
      { id: 'terminal', label: '终端命令', desc: '执行 PowerShell / Bash', tools: ['tool-pwsh', 'tool-bash'] },
      { id: 'web', label: '联网', desc: '搜索网页与抓取页面', tools: ['tool-web'] },
      { id: 'agents', label: '子代理', desc: '派生子代理并行工作', tools: ['delegation'] },
      { id: 'skills', label: '技能库', desc: '读取并调用已装技能', tools: ['skill-filesystem', 'tool-skill'] },
      { id: 'plan', label: '计划与待办', desc: '计划模式、目标与待办', tools: ['planning', 'tool-todo', 'tool-goal', 'command-goal'] },
      { id: 'jobs', label: '任务与定时', desc: '后台任务与定时执行', tools: ['tool-jobs', 'tool-schedule'] },
      { id: 'interact', label: '提问与交付', desc: '向用户提问、展示文件', tools: ['tool-ask-user', 'present'] },
      { id: 'extend', label: '扩展能力', desc: '插件管理、插件编写、批量执行器', tools: ['tool-plugin-manager', 'tool-plugin-market', 'tool-cordis', 'tool-executor-ptc'] },
      { id: 'context', label: '上下文压缩', desc: '长会话自动压缩（建议常开）', tools: ['compaction'] },
    ];
    const LOCKED = new Set(['persona', 'agent-instructions', 'time-context']);

    function msg(e) {
      return e && e.message ? e.message : String(e);
    }

    async function readJson(res) {
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error((body && (body.message || body.error)) || 'HTTP ' + res.status);
      return body;
    }

    async function getConfig() {
      return readJson(await fetch(BASE + '/config', { cache: 'no-store' }));
    }

    async function saveConfig(payload) {
      return readJson(await fetch(BASE + '/config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }));
    }

    async function restartStudio() {
      return readJson(await fetch(BASE + '/restart', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }));
    }

    function Field(props) {
      return h('div', { style: { marginBottom: 14 } },
        h('label', { style: labelStyle }, props.label),
        props.children,
        props.hint ? h('div', { style: { fontSize: 12, color: color.muted, marginTop: 4 } }, props.hint) : null,
      );
    }

    function Card(props) {
      return h('div', { style: card },
        h('div', { style: { fontSize: 15, fontWeight: 600, marginBottom: 4 } }, props.title),
        props.desc ? h('div', { style: { fontSize: 12, color: color.muted, marginBottom: 14 } }, props.desc) : null,
        props.children,
      );
    }

    function Switch(props) {
      return h('label', {
        style: {
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
          borderBottom: '1px solid ' + color.soft, cursor: 'pointer',
        },
      },
        h('input', {
          type: 'checkbox', checked: props.checked, disabled: props.disabled,
          onChange: (e) => props.onChange(e.target.checked),
        }),
        h('span', { style: { flex: 1, minWidth: 0 } },
          h('div', { style: { fontSize: 13 } }, props.label),
          props.desc ? h('div', { style: { fontSize: 12, color: color.muted, marginTop: 2 } }, props.desc) : null,
        ),
      );
    }

    function AgentPresetSettingsSection() {
      const [state, setState] = React.useState(null);
      const [loadError, setLoadError] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [notice, setNotice] = React.useState('');
      const [advanced, setAdvanced] = React.useState(false);

      React.useEffect(() => {
        let alive = true;
        (async () => {
          try {
            const cfg = await getConfig();
            if (!alive) return;
            setState({
              name: cfg.name || '默认模式',
              description: cfg.description || '',
              persona: cfg.persona || '',
              entries: Array.isArray(cfg.entries) ? cfg.entries : [],
              disabledTools: Array.isArray(cfg.disabledTools) ? cfg.disabledTools.slice() : [],
              channels: {
                wechat: {
                  mode: cfg.channels && cfg.channels.wechat && cfg.channels.wechat.mode === 'custom' ? 'custom' : 'inherit',
                  disabledTools: cfg.channels && cfg.channels.wechat && Array.isArray(cfg.channels.wechat.disabledTools)
                    ? cfg.channels.wechat.disabledTools.slice() : [],
                },
              },
            });
          } catch (e) {
            if (alive) setLoadError(msg(e));
          }
        })();
        return () => { alive = false; };
      }, []);

      const patch = (next) => setState((prev) => (prev === null ? prev : Object.assign({}, prev, next)));
      const patchWechat = (next) => setState((prev) => prev === null ? prev : Object.assign({}, prev, {
        channels: { wechat: Object.assign({}, prev.channels.wechat, next) },
      }));

      const enabledMap = React.useMemo(() => {
        const map = {};
        if (state === null) return map;
        for (const entry of state.entries) map[entry.id] = state.disabledTools.indexOf(entry.id) < 0;
        return map;
      }, [state]);

      const groupEnabled = (group) => {
        const ids = group.tools.filter((id) => id in enabledMap);
        return ids.length > 0 && ids.every((id) => enabledMap[id]);
      };

      const setGroup = (group, on) => {
        if (state === null) return;
        const ids = group.tools.filter((id) => id in enabledMap);
        const disabled = state.disabledTools.filter((id) => ids.indexOf(id) < 0);
        patch({ disabledTools: on ? disabled : disabled.concat(ids) });
      };

      const setEntry = (id, on) => {
        if (state === null) return;
        const disabled = state.disabledTools.filter((item) => item !== id);
        patch({ disabledTools: on ? disabled : disabled.concat([id]) });
      };

      const wechatEnabled = (group) => {
        if (state === null) return false;
        const ids = group.tools.filter((id) => id in enabledMap && enabledMap[id]);
        return ids.length > 0 && ids.every((id) => state.channels.wechat.disabledTools.indexOf(id) < 0);
      };

      const setWechatGroup = (group, on) => {
        if (state === null) return;
        const ids = group.tools.filter((id) => id in enabledMap && enabledMap[id]);
        const disabled = state.channels.wechat.disabledTools.filter((id) => ids.indexOf(id) < 0);
        patchWechat({ disabledTools: on ? disabled : disabled.concat(ids) });
      };

      const save = async (withRestart) => {
        if (state === null) return;
        setBusy(true); setNotice('');
        try {
          await saveConfig({
            name: state.name,
            description: state.description,
            persona: state.persona,
            disabledTools: state.disabledTools,
            channels: state.channels,
          });
          if (withRestart) {
            await restartStudio();
            setNotice('已保存，正在重启工作台；约 10 秒后页面自动刷新（若提示链接失效，用启动窗口新打印的链接打开）。');
            window.setTimeout(() => { window.location.reload(); }, 10000);
          } else {
            setNotice('已保存。重启工作台后生效；也可以点「保存并重启」立即应用。');
          }
        } catch (e) {
          setNotice((withRestart ? '保存/重启失败：' : '保存失败：') + msg(e));
        } finally {
          setBusy(false);
        }
      };

      if (loadError !== '') {
        return h('div', { style: { fontSize: 13, color: color.bad } }, '读取预设配置失败：' + loadError);
      }
      if (state === null) {
        return h('div', { style: { fontSize: 13, color: color.muted } }, '正在读取预设配置…');
      }

      const visibleEntries = state.entries.filter((entry) => !LOCKED.has(entry.id));
      const custom = state.channels.wechat.mode === 'custom';

      return h('div', { style: { maxWidth: 780 } },
        h('div', { style: { fontSize: 13, color: color.muted, marginBottom: 16, lineHeight: 1.7 } },
          '这里只配置唯一的「默认模式」：工作台、桌宠 Helper、微信渠道共用同一份预设。',
          h('br'),
          '改动写回 studio/profile/preset-settings.json，并重新生成 default-preset.yml；保存后重启工作台生效。'),
        notice !== ''
          ? h('div', { style: { fontSize: 13, marginBottom: 12, color: notice.indexOf('失败') >= 0 ? color.bad : color.ok } }, notice)
          : null,

        h(Card, { title: '基本信息', desc: '显示名与描述只影响设置页与会话头；唯一预设的内部 id 固定为 default。' },
          h(Field, { label: '显示名' },
            h('input', {
              value: state.name, onChange: (e) => patch({ name: e.target.value }),
              style: { width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 8, border: '1px solid ' + color.line, background: 'transparent', color: 'inherit' },
            }),
          ),
          h(Field, { label: '描述' },
            h('input', {
              value: state.description, onChange: (e) => patch({ description: e.target.value }),
              style: { width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 8, border: '1px solid ' + color.line, background: 'transparent', color: 'inherit' },
            }),
          ),
        ),

        h(Card, { title: '人设', desc: '默认模式的系统提示词开头。用 {{model}} 可插入当前模型名。' },
          h('textarea', {
            value: state.persona, rows: 10,
            onChange: (e) => patch({ persona: e.target.value }),
            style: {
              width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
              border: '1px solid ' + color.line, background: 'transparent', color: 'inherit',
              fontSize: 13, lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit',
            },
          }),
        ),

        h(Card, { title: '工具调用边界', desc: '按能力分组开合。关掉一组，默认模式与桌宠都不会再看到这组工具。' },
          GROUPS.map((group) => {
            const ids = group.tools.filter((id) => id in enabledMap);
            if (ids.length === 0) return null;
            return h(Switch, {
              key: group.id, label: group.label, desc: group.desc,
              checked: groupEnabled(group), onChange: (on) => setGroup(group, on),
            });
          }),
        ),

        h(Card, { title: '微信渠道', desc: '微信渠道默认与主会话完全一致。可单独关掉一部分能力，适合只让微信做轻量问答。' },
          h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginBottom: 8, cursor: 'pointer' } },
            h('input', {
              type: 'radio', name: 'wechat-mode', checked: !custom,
              onChange: () => patchWechat({ mode: 'inherit' }),
            }),
            '与主会话相同（推荐）',
          ),
          h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginBottom: 12, cursor: 'pointer' } },
            h('input', {
              type: 'radio', name: 'wechat-mode', checked: custom,
              onChange: () => patchWechat({ mode: 'custom' }),
            }),
            '自定义微信渠道能力（只做减法）',
          ),
          custom
            ? h('div', { style: { paddingLeft: 12, borderLeft: '2px solid ' + color.line } },
                GROUPS.map((group) => {
                  const ids = group.tools.filter((id) => id in enabledMap && enabledMap[id]);
                  if (ids.length === 0) return null;
                  return h(Switch, {
                    key: group.id, label: group.label, desc: '微信里保留：' + group.desc,
                    checked: wechatEnabled(group), onChange: (on) => setWechatGroup(group, on),
                  });
                }),
                h('div', { style: { fontSize: 12, color: color.muted, marginTop: 8 } },
                  '微信渠道实际能力 = 默认模式开启的工具 - 这里关掉的工具。'),
              )
            : h('div', { style: { fontSize: 12, color: color.muted } }, '当前微信渠道与主会话使用同一份工具清单。'),

          h('div', { style: { marginTop: 14, paddingTop: 12, borderTop: '1px solid ' + color.soft, fontSize: 12, color: color.muted, lineHeight: 1.7 } },
            '说明：微信渠道不会变成“另一个模式”；它仍是默认模式的内部变体，只在需要裁剪时生成。',
          ),
        ),

        h(Card, { title: '高级：逐个工具', desc: '需要精确控制时再展开。基础组件（人设、项目约定、时间上下文）固定启用。' },
          h('button', { type: 'button', style: buttonStyle, onClick: () => setAdvanced(!advanced) },
            advanced ? '收起清单' : '展开全部 ' + visibleEntries.length + ' 项'),
          advanced
            ? h('div', { style: { marginTop: 12 } },
                visibleEntries.map((entry) => h(Switch, {
                  key: entry.id,
                  label: ENTRY_LABELS[entry.id] || entry.name || entry.id,
                  desc: ENTRY_LABELS[entry.id] ? entry.id : entry.name,
                  checked: enabledMap[entry.id] !== false,
                  onChange: (on) => setEntry(entry.id, on),
                })),
              )
            : null,
        ),

        h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 } },
          h('button', { type: 'button', style: buttonStyle, disabled: busy, onClick: () => save(false) },
            busy ? '处理中…' : '保存'),
          h('button', {
            type: 'button', style: Object.assign({}, buttonStyle, { borderColor: color.line, fontWeight: 600 }),
            disabled: busy, onClick: () => save(true),
          }, busy ? '处理中…' : '保存并重启'),
          h('span', { style: { fontSize: 12, color: color.muted } }, '重启会让工作台短暂断线，桌宠同步使用新配置。'),
        ),
      );
    }

    exports.inject = ['slots'];

    exports.apply = (ctx) => {
      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          { name: 'settings.section', id: 'agent-presets', order: 20, label: () => 'Agent 预设' },
          AgentPresetSettingsSection,
        ),
      );
    };

    return module.exports;
  },
});
