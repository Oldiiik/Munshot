import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { runViewTransition } from "./vt";

export type Lang = "en" | "ru";

const KEY = "moonshot:lang";

const en = {
  nav: {
    how: "How it works",
    examples: "Examples",
    modes: "Modes",
    pricing: "Pricing",
    signIn: "Sign in",
    getStarted: "Get started",
  },
  hero: {
    title1: "A workspace for",
    title2: "decks with a point of view.",
    subtitle:
      "Brief, story, design, review and delivery live in one project. Moonshot helps at the exact step where the work needs it.",
  },
  prompt: {
    examples: [
      "A 6-slide investor pitch for a solar-powered drone delivery startup. Confident, optimistic, data-forward.",
      "Teach single-slit diffraction to high-school physics students. Friendly, visual, one idea per slide.",
      "A product launch deck for a privacy-first note-taking app. Minimal, premium, lots of whitespace.",
      "An onboarding lesson on how neural networks learn — analogies first, then a worked example.",
    ],
    assets: "Brand assets",
    autoBrand: "Auto brand",
    generate: "Generate deck",
  },
  how: {
    eyebrow: "The flow",
    title: "Watch it think",
    subtitle:
      "Brief to outline to rendered slides — the same pipeline you'll drive, on a loop.",
    brief:
      "A premium 6-slide deck for the new MacBook Air — real devices, clean Apple light, lots of air.",
    outline: [
      "MacBook Air",
      "Two sizes, one ultra-light design",
      "M5 performance that moves",
      "Built for Apple Intelligence",
      "Display, camera & connectivity",
      "Configure the Air you want",
    ],
    steps: ["Brief", "Outline", "Slides"],
    yourBrief: "Your brief",
    studying: "Studying the brand & planning the deck…",
    outlineLabel: "Outline",
    slidesWord: "slides",
    rendering: "Rendering slides",
  },
  examples: {
    eyebrow: "Real output",
    title: "Decks, not templates",
    subtitle: "Every slide here was rendered by Moonshot. Hover to take control.",
    decks: {
      mac: "Product launch · industrial luxury",
      iphone: "Product launch · clean & premium",
      future: "Editorial · collage explainer",
      solar: "Interactive · animated solar system",
    },
  },
  modes: {
    eyebrow: "Two products, one flow",
    title: "Pitch it, or teach it",
    subtitle:
      "The same brief-to-slides pipeline, tuned for two very different jobs.",
    moonshot: {
      tagline: "For brands & pitches",
      body: "Feed it a brief and brand assets. It infers your palette, type and voice, then renders a confident, on-brand deck.",
      points: ["Auto brand inference", "Investor & sales ready", "Dark, premium output"],
    },
    edu: {
      tagline: "For lessons & teaching",
      body: "Name a topic, drop the source material. It plans a curriculum-aware lesson — one idea per slide, analogies and worked examples.",
      points: ["One idea per slide", "Analogy for every concept", "Check-your-understanding"],
    },
  },
  faq: {
    eyebrow: "Good to know",
    title: "Questions, answered",
    items: [
      {
        q: "How does Moonshot learn my brand?",
        a: "Attach a logo, reference images or docs with your brief. Before planning, Moonshot studies them to infer your palette, typography and tone — then carries that through every slide.",
      },
      {
        q: "Can I edit the deck before it renders?",
        a: "Yes. Every deck starts as an editable outline of cards. Rewrite titles, edit the brief and notes, reorder, add or delete slides — only then do you render to images.",
      },
      {
        q: "What do I actually get out?",
        a: "Real rendered slides — one image per slide, kept visually consistent across the deck. Save any slide as a PNG, or export the whole deck as a print-ready PDF.",
      },
      {
        q: "What's the difference between Moonshot and Moonshot Edu?",
        a: "Same flow, different brain. Moonshot is tuned for brand and pitch decks; Edu is curriculum-aware — one idea per slide, analogies for abstract concepts, worked examples and recaps.",
      },
      {
        q: "Why is it invite-only?",
        a: "Moonshot runs on a shared generation engine with limited capacity. Invite codes keep quality high while we scale. Each account includes a set number of decks.",
      },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Pick your altitude",
    subtitle: "Start free. Move up when you need more decks and more power.",
    perMonth: "/mo",
    popular: "Most popular",
    tiers: {
      free: {
        name: "Free",
        price: "$0",
        tagline: "For trying it out",
        cta: "Start free",
        features: [
          "1 deck per day",
          "Up to 12 slides per deck",
          "Moonshot & Edu modes",
          "PDF & PNG export",
          "Publish to Community",
        ],
      },
      pro: {
        name: "Pro",
        price: "$20",
        tagline: "For regular creators",
        cta: "Go Pro",
        features: [
          "3 decks per day",
          "Web search grounding",
          "Pro reasoning mode",
          "Priority rendering queue",
          "Everything in Free",
        ],
      },
      ultra: {
        name: "Ultra",
        price: "$60",
        tagline: "For power users & teams",
        cta: "Go Ultra",
        features: [
          "Unlimited decks",
          "Highest-priority rendering",
          "Pro reasoning + web search",
          "Early access to new features",
          "Everything in Pro",
        ],
      },
    },
    note: "Prices in USD, billed monthly. Cancel anytime. By subscribing you agree to our Terms and acknowledge our Privacy Policy.",
  },
  cta: {
    title: "Ready for your",
    accent: "moonshot?",
    subtitle:
      "Turn your next idea into a finished, on-brand deck. It starts with a sentence.",
    button: "Get started",
  },
  footer: {
    tagline: "Brand briefs into AI-rendered decks. Invite-only.",
    terms: "Terms",
    privacy: "Privacy",
    refunds: "Refunds",
  },
};

type Dict = typeof en;

const ru: Dict = {
  nav: {
    how: "Как это работает",
    examples: "Примеры",
    modes: "Режимы",
    pricing: "Тарифы",
    signIn: "Войти",
    getStarted: "Начать",
  },
  hero: {
    title1: "Рабочее пространство для",
    title2: "презентаций с точкой зрения.",
    subtitle:
      "Бриф, история, дизайн, ревью и выпуск живут в одном проекте. Moonshot помогает именно там, где это нужно работе.",
  },
  prompt: {
    examples: [
      "Питч для инвесторов из 6 слайдов о стартапе доставки дронами на солнечной энергии. Уверенно, оптимистично, с упором на данные.",
      "Объясни дифракцию на одной щели школьникам на уроке физики. Дружелюбно, наглядно, одна идея на слайд.",
      "Презентация запуска продукта — приложение для заметок с приватностью на первом месте. Минимализм, премиум, много воздуха.",
      "Вводный урок о том, как обучаются нейросети — сначала аналогии, затем разбор примера.",
    ],
    assets: "Материалы бренда",
    autoBrand: "Авто-бренд",
    generate: "Создать колоду",
  },
  how: {
    eyebrow: "Процесс",
    title: "Смотрите, как он думает",
    subtitle:
      "От брифа к плану и готовым слайдам — тот же конвейер, которым вы управляете, в цикле.",
    brief:
      "Премиальная колода из 6 слайдов о новом MacBook Air — реальные устройства, чистый стиль Apple, много света.",
    outline: [
      "MacBook Air",
      "Два размера, один ультралёгкий дизайн",
      "Производительность M5 в движении",
      "Создан для Apple Intelligence",
      "Экран, камера и связь",
      "Настройте свой Air",
    ],
    steps: ["Бриф", "План", "Слайды"],
    yourBrief: "Ваш бриф",
    studying: "Изучаем бренд и планируем колоду…",
    outlineLabel: "План",
    slidesWord: "слайдов",
    rendering: "Отрисовка слайдов",
  },
  examples: {
    eyebrow: "Реальный результат",
    title: "Колоды, а не шаблоны",
    subtitle:
      "Каждый слайд здесь отрисован Moonshot. Наведите курсор, чтобы взять управление.",
    decks: {
      mac: "Запуск продукта · индустриальная роскошь",
      iphone: "Запуск продукта · чисто и премиально",
      future: "Редакционный · коллаж-объяснение",
      solar: "Интерактив · анимированная Солнечная система",
    },
  },
  modes: {
    eyebrow: "Два продукта, один процесс",
    title: "Питчите или обучайте",
    subtitle:
      "Тот же конвейер от брифа к слайдам, настроенный под две очень разные задачи.",
    moonshot: {
      tagline: "Для брендов и питчей",
      body: "Дайте бриф и материалы бренда. Он считывает палитру, шрифты и голос, затем отрисовывает уверенную колоду в стиле бренда.",
      points: ["Авто-считывание бренда", "Готово для инвесторов и продаж", "Тёмный премиум-вывод"],
    },
    edu: {
      tagline: "Для уроков и обучения",
      body: "Назовите тему, добавьте исходный материал. Он планирует урок с учётом программы — одна идея на слайд, аналогии и разбор примеров.",
      points: ["Одна идея на слайд", "Аналогия к каждому понятию", "Проверка понимания"],
    },
  },
  faq: {
    eyebrow: "Полезно знать",
    title: "Ответы на вопросы",
    items: [
      {
        q: "Как Moonshot изучает мой бренд?",
        a: "Прикрепите к брифу логотип, референсы или документы. Перед планированием Moonshot изучает их, чтобы считать палитру, типографику и тон — и проводит их через каждый слайд.",
      },
      {
        q: "Можно ли редактировать колоду до отрисовки?",
        a: "Да. Каждая колода начинается с редактируемого плана из карточек. Меняйте заголовки, правьте бриф и заметки, переставляйте, добавляйте или удаляйте слайды — и только потом отрисовывайте в изображения.",
      },
      {
        q: "Что я получаю на выходе?",
        a: "Настоящие отрисованные слайды — одно изображение на слайд, визуально согласованные по всей колоде. Сохраните любой слайд в PNG или экспортируйте всю колоду в готовый к печати PDF.",
      },
      {
        q: "В чём разница между Moonshot и Moonshot Edu?",
        a: "Один процесс, разный мозг. Moonshot настроен на бренд- и питч-колоды; Edu учитывает учебную программу — одна идея на слайд, аналогии для абстрактных понятий, разбор примеров и повторение.",
      },
      {
        q: "Почему доступ только по приглашению?",
        a: "Moonshot работает на общем движке генерации с ограниченной мощностью. Инвайт-коды держат качество высоким, пока мы масштабируемся. Каждому аккаунту доступно фиксированное число колод.",
      },
    ],
  },
  pricing: {
    eyebrow: "Тарифы",
    title: "Выберите свою высоту",
    subtitle: "Начните бесплатно. Поднимайтесь выше, когда нужно больше колод и мощности.",
    perMonth: "/мес",
    popular: "Популярный",
    tiers: {
      free: {
        name: "Free",
        price: "$0",
        tagline: "Чтобы попробовать",
        cta: "Начать бесплатно",
        features: [
          "1 колода в день",
          "До 12 слайдов в колоде",
          "Режимы Moonshot и Edu",
          "Экспорт в PDF и PNG",
          "Публикация в Сообществе",
        ],
      },
      pro: {
        name: "Pro",
        price: "$20",
        tagline: "Для постоянных авторов",
        cta: "Перейти на Pro",
        features: [
          "3 колоды в день",
          "Поиск в вебе",
          "Pro-режим рассуждений",
          "Приоритетная очередь отрисовки",
          "Всё из Free",
        ],
      },
      ultra: {
        name: "Ultra",
        price: "$60",
        tagline: "Для профи и команд",
        cta: "Перейти на Ultra",
        features: [
          "Безлимитные колоды",
          "Максимальный приоритет отрисовки",
          "Pro-рассуждения + поиск в вебе",
          "Ранний доступ к новинкам",
          "Всё из Pro",
        ],
      },
    },
    note: "Цены в USD, оплата ежемесячно. Отмена в любой момент. Оформляя подписку, вы соглашаетесь с Условиями и Политикой конфиденциальности.",
  },
  cta: {
    title: "Готовы к своему",
    accent: "прорыву?",
    subtitle:
      "Превратите следующую идею в готовую колоду в стиле бренда. Всё начинается с одного предложения.",
    button: "Начать",
  },
  footer: {
    tagline: "Брифы бренда в колоды, отрисованные ИИ. Только по приглашению.",
    terms: "Условия",
    privacy: "Конфиденциальность",
    refunds: "Возвраты",
  },
};

const DICTS: Record<Lang, Dict> = { en, ru };

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangRaw] = useState<Lang>(() => {
    const saved = localStorage.getItem(KEY);
    return saved === "ru" || saved === "en" ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem(KEY, lang);
  }, [lang]);

  // A native view transition cross-fades the old text into the new layout in one
  // smooth pass — no reflow flash, no manual opacity juggling.
  const setLang = (l: Lang) => {
    if (l === lang) return;
    runViewTransition(() => setLangRaw(l), { slow: true });
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t: DICTS[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
