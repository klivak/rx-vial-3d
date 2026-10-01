# rx-vial-3d - 3D-презентація продукту для телемедичного бренду

Назва репо: `klivak/rx-vial-3d`. Публікація: https://klivak.github.io/rx-vial-3d/
Вигаданий бренд у демо: **Aurel** (Aurel Health). Реальні бренди, назви препаратів і логотипи не використовуємо.

## 1. Навіщо це і для кого

Головний адресат - Bask Health (вакансія Three.js Front End Engineer, `jobs/2026-09-30-bask-health-three-js-front-end`). Перша вимога вакансії: "Shipped WebGL we can open - Three.js or React Three Fiber, live, running on a phone", а в кінці: "send a link to something you built that we can open on a phone".

Що демо має показати рекрутеру за 30 секунд з телефона:
- React Three Fiber + Next.js + TypeScript - їхній стек.
- "Real taste in motion, timing, and restraint" - мало ефектів, але кожен вивірений: плавні easing, паузи, без мерехтіння.
- Мобільний перформанс: 60 fps на середньому телефоні, швидке перше відображення.
- Продуктове мислення: це їхній бізнес (брендовані storefront-и телемедицини), а не абстрактна сцена.
- AR: "View in AR" ставить флакон на стіл через камеру телефона.
- Доступність: керування з клавіатури, `prefers-reduced-motion`, нормальний текст замість тексту всередині canvas.

Друге використання: інші 3D/motion-вакансії, Fiverr-гіги (3D product page), портфоліо в LinkedIn. Після реальної практики - R3F у profile.yaml як familiar (через profile-update).

## 2. Аналіз: що роблять схожі сторінки і що беремо

- Сторінки продуктів Apple (AirPods, iPhone): одна модель, камера рухається під скрол, текст з'являється поруч, сильні паузи між "кадрами". Беремо: scroll-driven камеру і ритм "кадр - пауза - кадр".
- Сторінки телемедичних брендів (Hims, Ro, Bask-storefront-и): чисті світлі фони, м'які тіні, медичний спокій, довіра (лікарі, ліцензії), один сильний CTA. Беремо: палітру і тон.
- Чого уникаємо: частинки, bloom на все, неон, "крутіння заради крутіння", важкі HDRI по 10 МБ, текст у WebGL.

## 3. Сюжет: 5 кадрів під скрол

Кожен кадр займає ~100vh скролу. Камера і флакон анімуються одним GSAP-таймлайном, прив'язаним до прогресу скролу (ScrollTrigger scrub). Текст - звичайний HTML поверх canvas.

1. **Hero.** Флакон по центру, повільний поворот на ~15° і "дихання" світла. Заголовок: "Care that comes to you." Підзаголовок: "Personalized treatment, prescribed online, delivered in days." Підказка "Scroll" внизу.
2. **Formula.** Камера наїжджає на етикетку, флакон повертається етикеткою до глядача. Текст ліворуч: "Clinically backed formula" + 3 короткі пункти. Етикетка - CanvasTexture, згенерована в коді (бренд, дозування, штрих-код).
3. **How it works.** Камера облітає флакон на 120°, поруч з'являються три кроки (HTML-картки по черзі): "Online consult - Doctor review - Delivered to your door". Кожен крок підсвічує свою частину сцени (кришка, етикетка, коробка позаду).
4. **Unboxing.** Коробка розкривається (кришка коробки відкидається, флакон піднімається на ~0.3 одиниці). Тінь під флаконом м'яко розходиться. Текст: "Discreet packaging, tracked delivery."
5. **CTA + AR.** Камера відходить на загальний план, фон темнішає на один тон. Кнопки: "Start your visit" (заглушка) і "View in AR". Тут же OrbitControls вмикаються: флакон можна крутити пальцем.

Перемикач кольору кришки (3 кольори) на кадрі 5 - маленька інтерактивність без шуму.

## 4. Технічний стек

- Next.js 15 (App Router), TypeScript, `output: 'export'` для статики, `basePath: '/rx-vial-3d'`, `images.unoptimized: true`.
- three, @react-three/fiber, @react-three/drei (Environment, ContactShadows, OrbitControls, useGLTF, PerformanceMonitor, AdaptiveDpr).
- GSAP + ScrollTrigger (scrub), `gsap.matchMedia()` для reduced motion і мобільних.
- Tailwind CSS для HTML-шару.
- AR: `@google/model-viewer` (web component), тільки для кнопки AR, підвантажується ліниво. Режими `ar-modes="webxr scene-viewer quick-look"`: Android - Scene Viewer/WebXR (GLB), iOS - Quick Look (USDZ).
- Деплой: GitHub Actions -> GitHub Pages (actions/upload-pages-artifact + deploy-pages). Файл `.nojekyll` у `out/`.
- Перевірки: ESLint, `tsc --noEmit`, Playwright smoke-тест (сторінка відкрилась, canvas є, немає помилок у консолі, скріншот на mobile viewport), Lighthouse у CI (опційно).

Чому model-viewer, а не AR.js: AR.js - маркерний AR (потрібен роздрукований маркер), а для "постав на стіл" потрібен markerless AR, який на телефонах дають саме Scene Viewer (Android) і Quick Look (iOS). Досвід з AR.js і A-Frame тут корисний як розуміння WebXR, але інструмент - сучасний.

## 5. 3D-модель

Модель будуємо в коді, без завантажених чужих моделей, щоб не мати проблем з ліцензіями і щоб показати Three.js-навички:
- Флакон: `LatheGeometry` за профілем (дно, корпус, плече, шийка), матеріал `MeshPhysicalMaterial` з transmission (бурштинове скло) і roughness ~0.1. На мобільних - fallback без transmission (дорогий), звичайна прозорість.
- Кришка: циліндр з насічками (`CylinderGeometry` + normal map або дрібні грані), матовий пластик.
- Етикетка: циліндрична смуга з `CanvasTexture` (текст бренду, дозування, вигаданий штрих-код).
- Коробка: `RoundedBox` з drei, матовий картон, кришка коробки окремим мешем для анімації.
- Освітлення: `Environment` з маленьким HDRI (студійний, до 1 МБ, CC0 з Poly Haven) або `Lightformer`-и drei (нуль завантажень - краще для мобільних), `ContactShadows` під флаконом.

Для AR модель експортується тим самим кодом: скрипт `scripts/export-models.ts` збирає сцену флакона, `GLTFExporter` -> `public/models/vial.glb`, `USDZExporter` -> `public/models/vial.usdz`. Одне джерело правди для сайту і AR. Розміри в реальних метрах (флакон ~9 см заввишки), щоб в AR він стояв у натуральну величину.

## 6. Рух і таймінг (головне для Bask)

- Один майстер-таймлайн GSAP, scrub: 0.8-1 (з інерцією, не "прилипає" до пальця).
- Easing: `power2.inOut` для камери, `power3.out` для появи тексту, `expo.out` для розкриття коробки. Без bounce і elastic.
- Текст з'являється на 10-15% прогресу кадру після руху камери, а не одночасно: спершу рух, потім слова.
- Між кадрами - "плато" ~20% скролу, де нічого не рухається. Це і є restraint.
- Idle-анімація флакона (повільне погойдування ±2°) тільки в кадрі 1 і 5.
- `prefers-reduced-motion`: камера перемикається між кадрами з коротким fade, без руху; idle-анімації вимкнені.
- Камера ніколи не перетинає модель і не робить різких розворотів понад 120° за кадр.

## 7. Мобільний перформанс

- Цілі: LCP < 2.5 с на 4G, 60 fps на середньому Android, загальна вага JS < 400 КБ gzip до AR, модель для AR < 1 МБ.
- `dpr={[1, 2]}` + `AdaptiveDpr` + `PerformanceMonitor` (при падінні fps - вимкнути transmission і знизити dpr).
- `frameloop="demand"` поза активним скролом/жестом.
- HTML-текст рендериться одразу (SSG), canvas підвантажується після першого відображення (`dynamic(() => import(...), { ssr: false })`), постер-зображення як плейсхолдер, поки WebGL ініціалізується.
- model-viewer - тільки при натисканні "View in AR".
- Перевірити на реальних пристроях: iPhone (Safari) і Android (Chrome). Через `pnpm dev --hostname 0.0.0.0` і LAN-адресу (або розширення QR Code to Phone).

## 8. Доступність і якість

- Весь текст - справжній HTML (заголовки h1/h2, читається скрінрідером), canvas з `aria-hidden` і текстовим описом поруч.
- Кнопки з фокусом, видимі focus ring, переміщення між кадрами з клавіатури (PageDown/стрілки працюють, бо це звичайний скрол).
- Контраст тексту AA.
- Fallback без WebGL: статичне зображення флакона і той самий текст.

## 9. Структура проєкту

```
rx-vial-3d/
  app/
    layout.tsx
    page.tsx             # HTML-кадри + lazy Canvas
    globals.css
  components/
    Experience.tsx       # Canvas, світло, камера, PerformanceMonitor
    Vial.tsx             # флакон: lathe-геометрія, скло, кришка, етикетка
    Box.tsx              # коробка з кришкою
    LabelTexture.ts      # CanvasTexture етикетки
    ScrollTimeline.tsx   # GSAP ScrollTrigger -> камера і об'єкти
    ArButton.tsx         # lazy model-viewer, AR
    Sections.tsx         # 5 HTML-кадрів
  lib/
    frames.ts            # позиції камери і стани для кожного кадру (дані, не код)
  scripts/
    export-models.ts     # GLB + USDZ для AR
  public/
    models/vial.glb, vial.usdz
    poster.webp
  tests/
    smoke.spec.ts        # Playwright, mobile viewport
  .github/workflows/deploy.yml
  next.config.ts         # output: 'export', basePath
  README.md              # англійською: що це, стек, рішення щодо руху і перформансу, скріншот/GIF
```

## 10. План робіт (один-два вечори)

1. Каркас: Next.js + TS + Tailwind, static export, basePath, деплой порожньої сторінки на Pages через Actions. Перевірити, що відкривається з телефона.
2. Сцена: флакон (lathe), кришка, етикетка, світло, тіні. Статично, гарно, на телефоні.
3. Кадри: HTML-секції + `frames.ts` + GSAP-таймлайн під скрол. Налаштувати ритм і плато.
4. Коробка і unboxing (кадр 4), OrbitControls і перемикач кольору (кадр 5).
5. AR: export-models, model-viewer, перевірка на Android і iPhone.
6. Перформанс і доступність: PerformanceMonitor, reduced motion, fallback, Lighthouse.
7. README англійською з GIF, посилання в профіль GitHub, smoke-тест у CI.

Ролі: Claude збирає каркас, сцену, таймлайн і деплой; Vlad доводить візуал (кольори, світло, таймінг), перевіряє на своєму телефоні і вирішує, що прибрати. Код, який Vlad не розуміє і не може пояснити на співбесіді, - не лишаємо.

## 11. Критерії готовності

- Посилання https://klivak.github.io/rx-vial-3d/ відкривається на iPhone і Android, скрол плавний, без ривків.
- "View in AR" ставить флакон на стіл на обох платформах (або чесно ховається, де AR недоступний).
- Lighthouse mobile: Performance 90+, Accessibility 95+.
- Немає помилок у консолі, smoke-тест зелений.
- README пояснює рішення щодо руху і перформансу - це те, що Vlad розповідає на інтерв'ю.

## 12. Після публікації

- Посилання - в резюме Bask (Products & Open Source) і в поле форми / cover letter.
- profile-update: новий проєкт у profile.yaml, React Three Fiber -> familiar (після того, як Vlad реально працював з кодом).
- Подача в Bask через apply-form.
