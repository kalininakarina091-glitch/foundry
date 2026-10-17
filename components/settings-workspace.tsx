"use client";
import { useState, type ReactNode, type FormEvent } from "react";
import Link from "next/link";
import {
  Settings2,
  Database,
  Bell,
  Palette,
  Link2,
  Grid2X2,
  SlidersHorizontal,
  List,
  AlignLeft,
  Minimize2,
  Sparkles,
  CheckCheck,
  Mail,
  ArrowUpRight,
  ShieldCheck,
  Rss,
  GitBranch,
  Radio,
  Check,
} from "lucide-react";
import { usePreferences, savePreferences } from "@/lib/use-preferences";
import type { Preferences } from "@/lib/preferences";
type Source = {
  id: string;
  name: string;
  type: string;
  status: string;
  count: number;
};
const tabs = [
  { id: "general", label: "Основные", icon: Settings2 },
  { id: "sources", label: "Источники данных", icon: Database },
  { id: "notifications", label: "Уведомления", icon: Bell },
  { id: "appearance", label: "Внешний вид", icon: Palette },
  { id: "integrations", label: "API и интеграции", icon: Link2 },
];
export default function SettingsWorkspace({
  sources,
  aiConfigured,
}: {
  sources: Source[];
  aiConfigured: boolean;
}) {
  const [tab, setTab] = useState("general");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const preferences = usePreferences();
  async function save(patch: Partial<Preferences>) {
    try {
      await savePreferences(patch);
      setFailed(false);
      setMessage("Изменения сохранены в вашем аккаунте.");
    } catch {
      setFailed(true);
      setMessage(
        "Не удалось сохранить настройки. Проверьте подключение и повторите.",
      );
    }
  }
  return (
    <>
      <nav className="settings-tabs" aria-label="Разделы настроек">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            aria-pressed={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
      <div className="settings-save-status" role={failed ? "alert" : "status"}>
        {message && (
          <span className={failed ? "settings-error" : "settings-success"}>
            {!failed && <Check size={14} />}
            {message}
          </span>
        )}
      </div>
      {tab === "general" && (
        <div className="settings-grid">
          <Profile
            key={`${preferences.name}:${preferences.email}:${preferences.about}`}
            preferences={preferences}
            onSave={save}
          />
          <PreferencesPanel preferences={preferences} onSave={save} />
          <Notifications />
          <Sources sources={sources} />
        </div>
      )}
      {tab === "sources" && (
        <div className="settings-grid">
          <Sources sources={sources} />
          <Panel
            title="От источника к возможности"
            description="Каждое исследование начинается с проверяемых материалов."
          >
            <div className="settings-pipeline">
              {[
                [
                  "01",
                  "Источники",
                  "Соберите публикации и обсуждения.",
                  "/sources",
                ],
                [
                  "02",
                  "Сигналы",
                  "Выделите проблемы и потребности.",
                  "/signals",
                ],
                [
                  "03",
                  "Паттерны",
                  "Найдите повторяющиеся проблемы.",
                  "/patterns",
                ],
              ].map(([n, title, body, href]) => (
                <Link href={href} key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
            <p className="settings-hint">
              Статусы отражают записи проекта. Синхронизация запускается на
              странице источников.
            </p>
          </Panel>
        </div>
      )}
      {tab === "notifications" && (
        <div className="settings-grid">
          <Notifications />
          <Panel
            title="Результаты исследования"
            description="Где найти изменения в вашем проекте."
          >
            <div className="settings-info">
              <ShieldCheck size={28} />
              <h3>Данные остаются в проекте</h3>
              <p>
                Новые возможности доступны в каталоге. Результат AI-проверки
                отображается на странице проверки; история результатов пока не
                сохраняется.
              </p>
              <Link href="/opportunities" className="button-secondary">
                Открыть возможности <ArrowUpRight size={14} />
              </Link>
            </div>
          </Panel>
        </div>
      )}
      {tab === "appearance" && (
        <div className="settings-grid">
          <Panel
            title="Тема интерфейса"
            description="Тёмная палитра с фиолетовым акцентом."
          >
            <div className="theme-preview" aria-hidden="true">
              <div className="theme-mini-sidebar">
                <i />
                <i />
                <i />
              </div>
              <div className="theme-mini-main">
                <i />
                <div>
                  <i />
                  <i />
                  <i />
                </div>
                <div>
                  <i />
                  <i />
                </div>
              </div>
            </div>
            <div className="theme-caption">
              <span>
                <span className="theme-swatch" />
                Foundry Dark
              </span>
              <span className="settings-success">
                <Check size={15} />
                Активна
              </span>
            </div>
            <p className="settings-hint">
              Светлая тема пока не поддерживается.
            </p>
          </Panel>
          <PreferencesPanel preferences={preferences} onSave={save} />
        </div>
      )}
      {tab === "integrations" && (
        <div className="settings-grid">
          <Panel
            title="AI-проверка"
            description="Подключение провайдера для исследования гипотез."
          >
            <div className="integration-provider">
              <span className="settings-provider-icon">
                <Sparkles size={26} />
              </span>
              <div>
                <h3>OpenRouter</h3>
                <p>Анализ возможностей и доказательств</p>
              </div>
              <span
                className={`source-status ${aiConfigured ? "is-active" : ""}`}
              >
                {aiConfigured ? "Ключ настроен" : "Не настроен"}
              </span>
            </div>
            <p className="settings-hint">
              {aiConfigured
                ? "Доступность провайдера проверяется при запросе. Ключ хранится только на сервере."
                : "Для подключения добавьте OPENROUTER_API_KEY в окружение сервера и перезапустите проект."}
            </p>
            <Link href="/opportunities" className="button-secondary mt-5">
              Выбрать возможность <ArrowUpRight size={14} />
            </Link>
          </Panel>
          <Panel
            title="Рабочее пространство"
            description="Настройки и данные текущей версии Foundry."
          >
            <div className="settings-info">
              <Database size={28} />
              <h3>Локальный проект</h3>
              <p>
                Источники и возможности хранятся в базе проекта. Профиль,
                избранное и предпочтения интерфейса сохраняются на сервере и
                привязаны к вашему аккаунту.
              </p>
              <p>Аккаунты команды и оплата пока не подключены.</p>
            </div>
          </Panel>
        </div>
      )}
      <p className="settings-footer-note">
        Настройки интерфейса сохраняются в вашем аккаунте.
      </p>
    </>
  );
}
function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="settings-panel">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
function Profile({
  preferences: p,
  onSave,
}: {
  preferences: Preferences;
  onSave: (patch: Partial<Preferences>) => void;
}) {
  const [name, setName] = useState(p.name);
  const [email, setEmail] = useState(p.email);
  const [about, setAbout] = useState(p.about);
  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({ name: name.trim(), email: email.trim(), about: about.trim() });
  }
  return (
    <Panel
      title="Профиль"
      description="Как вы отображаетесь в этом рабочем пространстве."
    >
      <div className="profile-summary">
        <span className="profile-avatar">
          {name.trim().slice(0, 1).toUpperCase() || "F"}
        </span>
        <div>
          <h3>{name.trim() || "Ваш профиль"}</h3>
          <p>{email || "Контактный email не указан"}</p>
          <span className="profile-local-badge">Профиль аккаунта</span>
        </div>
      </div>
      <form onSubmit={submit} className="profile-form">
        <div className="profile-fields">
          <label>
            Имя
            <input
              className="field"
              value={name}
              maxLength={80}
              autoComplete="name"
              placeholder="Как к вам обращаться"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              className="field"
              value={email}
              readOnly
              maxLength={254}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>
        <label>
          О себе <span>(необязательно)</span>
          <textarea
            className="field"
            rows={3}
            value={about}
            maxLength={200}
            placeholder="Какие возможности вы ищете?"
            onChange={(e) => setAbout(e.target.value)}
          />
        </label>
        <span className="profile-counter">{about.length}/200</span>
        <div className="profile-save">
          <p>Email используется для входа. Изменение адреса пока недоступно.</p>
          <button className="button-primary" type="submit">
            Сохранить изменения
          </button>
        </div>
      </form>
    </Panel>
  );
}
function PreferencesPanel({
  preferences: p,
  onSave,
}: {
  preferences: Preferences;
  onSave: (patch: Partial<Preferences>) => void;
}) {
  return (
    <Panel
      title="Предпочтения"
      description="Настройте Foundry под свой способ исследования."
    >
      <div className="preference-list">
        <SettingRow
          icon={<Grid2X2 size={19} />}
          title="Вид каталога"
          description="Как показывать возможности при открытии."
        >
          <select
            aria-label="Вид каталога"
            value={p.catalogLayout}
            onChange={(e) =>
              onSave({
                catalogLayout: e.target.value as Preferences["catalogLayout"],
              })
            }
          >
            <option value="grid">Сетка карточек</option>
            <option value="list">Список</option>
          </select>
        </SettingRow>
        <SettingRow
          icon={<SlidersHorizontal size={19} />}
          title="Сортировка"
          description="Порядок возможностей по умолчанию."
        >
          <select
            aria-label="Сортировка по умолчанию"
            value={p.catalogSort}
            onChange={(e) =>
              onSave({
                catalogSort: e.target.value as Preferences["catalogSort"],
              })
            }
          >
            <option value="score">По Score</option>
            <option value="evidence">По доказательствам</option>
            <option value="recent">Сначала новые</option>
          </select>
        </SettingRow>
        <SettingRow
          icon={<List size={19} />}
          title="Результатов на странице"
          description="Количество карточек в каталоге."
        >
          <select
            aria-label="Результатов на странице"
            value={p.pageSize}
            onChange={(e) =>
              onSave({
                pageSize: Number(e.target.value) as Preferences["pageSize"],
              })
            }
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </SettingRow>
        <SettingRow
          icon={<AlignLeft size={19} />}
          title="Описание проблемы"
          description="Показывать описание в карточках."
        >
          <Toggle
            label="Описание проблемы"
            value={p.showDescriptions}
            onChange={() => onSave({ showDescriptions: !p.showDescriptions })}
          />
        </SettingRow>
        <SettingRow
          icon={<Minimize2 size={19} />}
          title="Компактный интерфейс"
          description="Меньше отступов в карточках и таблице."
        >
          <Toggle
            label="Компактный интерфейс"
            value={p.compact}
            onChange={() => onSave({ compact: !p.compact })}
          />
        </SettingRow>
      </div>
    </Panel>
  );
}
function SettingRow({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="setting-row">
      <span className="setting-row-icon">{icon}</span>
      <div className="setting-row-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={value}
      onClick={onChange}
      className={`settings-switch ${value ? "is-on" : ""}`}
    >
      <span />
    </button>
  );
}
function Notifications() {
  return (
    <Panel
      title="Уведомления"
      description="Обновления о возможностях и результатах исследования."
    >
      <div className="notification-notice">
        <Bell size={16} />
        <p>
          Доставка уведомлений пока не подключена. Foundry не отправляет письма
          или push-уведомления.
        </p>
      </div>
      <div className="notification-list">
        {[
          {
            icon: Sparkles,
            title: "Новые возможности",
            description: "Обнаруженные проблемы и идеи.",
          },
          {
            icon: CheckCheck,
            title: "Результаты проверки",
            description: "Выводы по исследуемым гипотезам.",
          },
          {
            icon: Mail,
            title: "Еженедельная сводка",
            description: "Итоги исследования за неделю.",
          },
        ].map(({ icon: Icon, title, description }) => (
          <SettingRow
            key={title}
            icon={<Icon size={19} />}
            title={title}
            description={description}
          >
            <span className="not-available">Не подключено</span>
          </SettingRow>
        ))}
      </div>
    </Panel>
  );
}
function Sources({ sources }: { sources: Source[] }) {
  const visible = sources.slice(0, 5);
  return (
    <Panel
      title="Источники данных"
      description="Откуда Foundry получает рыночные сигналы."
      action={
        <Link href="/sources" className="button-secondary">
          Настроить <ArrowUpRight size={13} />
        </Link>
      }
    >
      <div className="settings-sources">
        {visible.length ? (
          visible.map((s) => {
            const Icon =
              s.type === "github" ? GitBranch : s.type === "rss" ? Rss : Radio;
            return (
              <div className="settings-source-row" key={s.id}>
                <span
                  className={`settings-source-icon source-${["github", "rss", "hackernews", "reddit"].includes(s.type) ? s.type : "other"}`}
                >
                  <Icon size={20} />
                </span>
                <div>
                  <h3>{s.name}</h3>
                  <p>
                    {s.type} · {s.count.toLocaleString("ru-RU")} материалов
                  </p>
                </div>
                <span
                  className={`source-status ${s.status === "active" ? "is-active" : s.status === "error" ? "is-error" : ""}`}
                >
                  <i />
                  {s.status === "active"
                    ? "Активен"
                    : s.status === "error"
                      ? "Ошибка"
                      : "Отключён"}
                </span>
              </div>
            );
          })
        ) : (
          <div className="settings-empty">
            <Database size={27} />
            <h3>Источники ещё не добавлены</h3>
            <p>Подключите первый источник, чтобы начать собирать сигналы.</p>
            <Link href="/sources" className="button-primary">
              Добавить источник
            </Link>
          </div>
        )}
      </div>
      {sources.length > 5 && (
        <Link className="settings-all-sources" href="/sources">
          Все источники ({sources.length}) →
        </Link>
      )}
    </Panel>
  );
}
