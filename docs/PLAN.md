# rx-vial-3d - детальний план реалізації

Документ доповнює `docs/SPEC.md`: SPEC відповідає на "що і навіщо", цей план - на "як, в якому порядку і як перевірити". Кожна фаза закінчується робочим деплоєм на GitHub Pages, щоб у будь-який момент було посилання, яке можна відкрити з телефона.

## 0. Принципи виконання

- Вертикальні зрізи: після кожної фази сайт задеплоєний і відкривається на телефоні. Ніколи не накопичуємо "незадеплоєні" тижні роботи.
- Дані окремо від коду: усі позиції камери, кути, кольори і таймінги живуть у `lib/frames.ts` і `lib/theme.ts`. Налаштування руху - це правка чисел, а не логіки.
- Одне джерело правди для 3D: ті самі функції-фабрики геометрії і матеріалів використовуються і в сцені сайту, і в експорті GLB/USDZ для AR.
- Мобільний перший: кожну візуальну зміну спершу дивимось на телефоні (LAN або Pages), потім на десктопі.
- Бюджети як тести: розмір JS, вага моделей і помилки консолі перевіряються в CI, а не "на око".
- Мінімум залежностей: кожна нова бібліотека має бути виправдана (див. розділ 2).

## 1. Ключові архітектурні рішення

### 1.1 Рендеринг сторінки

- Next.js 15 App Router зі `output: 'export'` - повністю статичний сайт, жодного серверного коду. `basePath` і `assetPrefix` = `/rx-vial-3d` тільки в production (через `process.env.NODE_ENV`), щоб локально працював `localhost:3000/`.
- `app/page.tsx` - серверний компонент, що рендерить весь HTML-текст (5 секцій) у статичний HTML. Це дає швидкий LCP і нормальний текст для скрінрідера і пошуку.
- 3D-сцена підключається через `next/dynamic(() => import('@/components/Experience'), { ssr: false })` і монтується у `position: fixed; inset: 0` шар під текстом. До ініціалізації WebGL видно `poster.webp`, після першого кадру постер плавно зникає (opacity 400 мс).
- Хелпер `lib/asset.ts` з функцією `asset(path)`, що додає basePath до шляхів моделей і постера (статичний export не робить цього автоматично для `fetch`/`useGLTF`/model-viewer).

### 1.2 Зв'язок скролу і 3D (найважливіше рішення)

- GSAP не анімує Three.js-об'єкти напряму. Він анімує простий мутабельний об'єкт стану `sceneState` (позиція камери, target, кут флакона, прогрес розкриття коробки, opacity підсвіток тощо), створений один раз у `lib/sceneState.ts`.
- `useFrame` у компонентах читає `sceneState` і застосовує до мешів і камери. Так GSAP-таймлайн не залежить від React-рендерів, а React не ре-рендериться на кожен кадр скролу.
- `frameloop="demand"`: у `onUpdate` таймлайну і під час idle-анімацій викликаємо `invalidate()`. Коли користувач не скролить і нічого не рухається - GPU простоює (батарея телефона).
- Майстер-таймлайн будується з `frames.ts`: для кожного переходу між кадрами - сегмент руху (~80%) і плато (~20%). Текстові анімації - окремі ScrollTrigger-и на HTML-секціях (`power3.out`, запізнення 10-15% після руху камери).
- `ScrollTrigger` scrub: 0.9; `gsap.matchMedia()` розділяє три режими: десктоп, мобільний (менші амплітуди камери, бо вужчий кадр), `prefers-reduced-motion` (без scrub, перемикання станів з fade 300 мс за `onEnter` кожної секції).
- Стан кадру 5 (OrbitControls) вмикається тільки коли прогрес > 0.97, щоб жест пальцем не конфліктував зі скролом сторінки. На мобільних OrbitControls з `enableZoom={false}` і `enablePan={false}`, обертання тільки горизонтальне, щоб вертикальний свайп і далі скролив.

### 1.3 3D-модель у коді

- `lib/geometry/vialProfile.ts` - масив точок профілю (Vector2) в метрах: дно з фаскою, корпус, плече, шийка, різьба. Висота ~0.09 м, діаметр ~0.04 м.
- `LatheGeometry(points, 64)` на десктопі, 40 сегментів на мобільних. Скло подвійне (зовнішня і внутрішня стінка) - інакше transmission виглядає "пластиково".
- Рідина всередині - окремий lathe з нижчим профілем, MeshPhysicalMaterial без transmission (дешево і дає глибину).
- Кришка: `CylinderGeometry` + процедурна normal map насічок (генерується на canvas один раз). Колір кришки - з `theme.capColors[]`.
- Етикетка: `CylinderGeometry` з `openEnded: true` і обмеженим `thetaLength` (~200°), радіус трохи більший за корпус. Текстура - `CanvasTexture` 1024x512 (512x256 на мобільних), малюється в `LabelTexture.ts`: бренд Aurel, назва "Aurel Daily", дозування, вигаданий штрих-код, дрібний текст. Шрифт чекаємо через `document.fonts.ready` перед малюванням.
- Коробка: `RoundedBox` з drei, кришка - окремий меш з pivot на задньому ребрі (обгорнута в group зі зміщенням), щоб `rotation.x` відкривало її як справжню коробку.
- Світло: `Environment` з `Lightformer`-ами drei (нуль мережевих запитів) - один великий softbox зверху, два вузьких rim-світла з боків для відблисків на склі. HDRI з Poly Haven - тільки якщо Lightformer-и не дають потрібного вигляду скла (рішення на фазі 2).
- `ContactShadows` з `frames={1}` (запікається раз) і перерахунком тільки під час unboxing.
- Матеріали в `lib/materials.ts`: `createGlassMaterial({ quality })` повертає `MeshPhysicalMaterial` з transmission для high і звичайну прозорість (`transparent`, `opacity 0.85`, `envMapIntensity`) для low.

### 1.4 AR

- `@google/model-viewer` підвантажується через `import()` тільки при натисканні "View in AR". Елемент створюється прихованим, після `load` викликаємо `activateAR()`.
- Перед показом кнопки перевіряємо підтримку: `canActivateAR` після ініціалізації; якщо AR недоступний (десктоп) - кнопка змінюється на "Open on your phone" з QR-кодом поточного URL (QR генерується в SVG без бібліотеки або крихітною `qrcode-generator`).
- GLB і USDZ генеруються не в Node (у Node немає canvas для текстури етикетки і `USDZExporter` очікує DOM), а в браузері: dev-сторінка `app/export/page.tsx` (виключена з production-збірки) будує ту саму сцену і викликає `GLTFExporter` і `USDZExporter`. Скрипт `scripts/export-models.ts` запускає її через Playwright, перехоплює blob-и і пише у `public/models/`. Файли комітимо в репо (детермінованість деплою, не залежимо від браузера в CI).
- Для AR-моделі: transmission замінюється на прозорий PBR (Quick Look і Scene Viewer transmission підтримують погано), текстура етикетки 1024 px у JPEG, геометрія з помірною сегментацією. Цільова вага < 1 МБ кожен файл.

### 1.5 Продуктивність

- `<Canvas dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>` + `AdaptiveDpr` + `PerformanceMonitor`: `onDecline` -> `quality = 'low'` (вимикає transmission, dpr 1, менше сегментів), `onIncline` -> назад. Стан якості в маленькому Zustand-сторі (або React context) - zustand вже є транзитивно в R3F.
- Початковий рівень якості визначається евристикою: `navigator.hardwareConcurrency <= 4` або мобільний UA -> старт з `low`, апгрейд через PerformanceMonitor.
- Імпорти з drei точкові (`import { RoundedBox } from '@react-three/drei'` - tree-shaking працює, але перевіряємо через `@next/bundle-analyzer`).
- Текстури етикетки і normal map кришки створюються один раз і кешуються в модулі.
- Ніяких postprocessing-пакетів - вони дорогі на мобільних і не потрібні для цього стилю.

### 1.6 Доступність

- Canvas у контейнері з `aria-hidden="true"`; поруч `<p className="sr-only">` з описом сцени.
- Семантика: один `h1` (Hero), `h2` для кожного кадру, кнопки - справжні `<button>`, посилання - `<a>`.
- Видимий focus ring (Tailwind `focus-visible:ring`), skip-link "Skip to content".
- Перемикач кольору кришки - `role="radiogroup"` з трьома `role="radio"`, стрілки змінюють вибір, `aria-label` з назвою кольору.
- Fallback без WebGL: перевірка `WebGL2RenderingContext` / створення контексту до монтування Canvas; якщо невдало - лишаємо постер і текст, ховаємо AR-кнопку.
- Контраст перевіряється на обох фонах (світлий кадри 1-4 і темніший кадр 5).

## 2. Залежності (фіксований список)

Runtime: `next`, `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`, `gsap`, `@google/model-viewer` (lazy).

Dev: `typescript`, `@types/three`, `tailwindcss`, `eslint` + `eslint-config-next`, `prettier`, `@playwright/test`, `@next/bundle-analyzer`, `@lhci/cli` (опційно), `tsx` (для скриптів).

Менеджер пакетів: pnpm, версія Node зафіксована в `.nvmrc` і `packageManager` у `package.json`.

## 3. Фази робіт

Оцінки - для зосередженої роботи; SPEC каже "один-два вечори" для мінімальної версії, цей план розписує повну якісну версію, яку можна стиснути, викинувши пункти з позначкою (опц.).

### Фаза 1. Каркас і деплой (~2 год)

Задачі:
1. `pnpm create next-app` з TypeScript, App Router, Tailwind, ESLint, без `src/`. Alias `@/*`.
2. `next.config.ts`: `output: 'export'`, `images.unoptimized: true`, `basePath`/`assetPrefix` тільки в production, `trailingSlash: true` (стабільніше на Pages).
3. `lib/asset.ts`, `lib/theme.ts` (палітра: фон `#F4F1EC`, текст `#1B1D1F`, акцент, 3 кольори кришки).
4. `app/layout.tsx`: шрифт через `next/font` (Inter або схожий, self-hosted), метатеги, `viewport` з `themeColor`, Open Graph з постером.
5. `app/page.tsx`: 5 HTML-секцій з фінальними текстами зі SPEC (поки без 3D), кожна `min-h-screen`.
6. `.github/workflows/deploy.yml`: checkout -> pnpm setup -> install (кеш) -> lint -> `tsc --noEmit` -> build -> `touch out/.nojekyll` -> `upload-pages-artifact` -> `deploy-pages`. Тригер: push у `main` + `workflow_dispatch`.
7. У налаштуваннях репо: Pages -> Source: GitHub Actions.
8. `.nvmrc`, `.prettierrc`, `.editorconfig`, базовий `README.md`.

Готово, коли: https://klivak.github.io/rx-vial-3d/ відкривається на телефоні, видно 5 секцій тексту, шрифт і стилі підвантажені (немає 404 через basePath).

### Фаза 2. Статична сцена (~4-5 год)

Задачі:
1. `components/Experience.tsx`: Canvas, камера (fov 30 - "продуктова" вузька оптика, менше перспективних спотворень), Lightformer-environment, ContactShadows, PerformanceMonitor, AdaptiveDpr.
2. `lib/geometry/vialProfile.ts` + `components/Vial.tsx`: скло (подвійна стінка), рідина, кришка, етикетка.
3. `components/LabelTexture.ts`: малювання етикетки на canvas, вигаданий штрих-код (EAN-подібні смуги з фіксованого seed).
4. `lib/materials.ts` з high/low якістю, `lib/quality.ts` (стор якості + початкова евристика).
5. Lazy-монтування Canvas, постер-плейсхолдер (тимчасово - скріншот сцени, фінальний - у фазі 6), fade постера після першого кадру (`onCreated` + `requestAnimationFrame`).
6. Перевірка WebGL і fallback.
7. Тимчасовий `?debug` режим: `leva` або `r3f-perf` підключені тільки через dynamic import при наявності параметра (не потрапляє в основний бандл) - для налаштування світла з телефона.

Готово, коли: флакон виглядає як бурштинове скло з читабельною етикеткою, на телефоні стабільно 60 fps (перевірка через `?debug`), без мерехтіння тіней.

Ризик: transmission на iOS Safari може бути повільним або артефактним -> одразу перевіряємо на iPhone; якщо погано, на iOS стартуємо з `low`.

### Фаза 3. Скрол-таймлайн і ритм (~4 год)

Задачі:
1. `lib/frames.ts`: масив з 5 станів `{ camera: [x,y,z], target: [x,y,z], vialRotationY, boxLid, boxOffset, highlight, bgTone }` + параметри переходів (`duration`, `ease`, `plateau`). Окремі значення для мобільного (`frames.mobile`) там, де кадр вужчий.
2. `lib/sceneState.ts`: мутабельний об'єкт стану, ініціалізований кадром 1.
3. `components/ScrollTimeline.tsx`: реєстрація ScrollTrigger, побудова майстер-таймлайну з `frames.ts`, `gsap.matchMedia()` на три режими, `invalidate()` в `onUpdate`, коректне прибирання (`ctx.revert()`) при unmount і в Fast Refresh.
4. `components/CameraRig.tsx`: `useFrame` застосовує `sceneState.camera/target` (`camera.lookAt`), `Vial` і `Box` читають свої поля.
5. Текстові анімації секцій: `y: 24 -> 0`, `opacity 0 -> 1`, `power3.out`, запуск із затримкою відносно руху камери.
6. Кадр 3: три кроки-картки з'являються по черзі, підсвічування частини сцени (емісивний відтінок або локальний Lightformer, що плавно змінює інтенсивність).
7. Idle-погойдування ±2° тільки в кадрах 1 і 5 (зважене за прогресом, щоб не було стрибка при вході/виході).
8. Перевірка інваріантів у dev-режимі: `assertCameraOutsideBounds()` - камера не ближче за мінімальну відстань до центру флакона; кут між сусідніми кадрами ≤ 120°.

Готово, коли: на телефоні скрол від початку до кінця плавний, є відчутні паузи між кадрами, текст з'являється після руху, швидкий фліп пальцем не ламає стан (scrub з інерцією наздоганяє).

Налаштування таймінгу - разом з Vlad: записати 2-3 відео з екрана телефона, переглянути покадрово, правити тільки `frames.ts`.

### Фаза 4. Unboxing, OrbitControls, колір кришки (~3 год)

Задачі:
1. `components/Box.tsx`: коробка з кришкою на pivot, картонний матеріал (roughness 0.9, легкий процедурний noise у normal map), бренд-лого на кришці через другу CanvasTexture.
2. Кадр 4 у таймлайні: кришка `rotation.x` 0 -> -110° (`expo.out`), флакон +0.3 одиниці по Y, ContactShadows розходиться (scale/opacity/blur), тінь перераховується тільки під час цього сегмента.
3. Кадр 5: фон темнішає на один тон (CSS-змінна на `body` + `scene.background`/`gl.setClearColor` синхронно з тим самим прогресом), OrbitControls вмикаються при прогресі > 0.97 з плавним передаванням поточної позиції камери (без стрибка).
4. `components/CapColorPicker.tsx`: 3 кольори, анімація кольору матеріалу 300 мс (`color.lerp` в `useFrame`), вибір зберігається в URL-хеші (`#cap=sage`) - дрібниця, яка показує продуктове мислення (можна поділитись конфігурацією).
5. Кнопка "Start your visit" - заглушка, що веде на `#` з toast "Demo only".

Готово, коли: unboxing читається з першого перегляду, флакон можна крутити пальцем у кадрі 5, вертикальний свайп при цьому все ще скролить сторінку.

### Фаза 5. AR (~4 год, найбільший ризик)

Задачі:
1. Рефактор: фабрики `buildVialObject({ quality: 'ar' })` у `lib/scene/` - повертають чистий `THREE.Group` без React, і `Vial.tsx` використовує їх же через `<primitive>` або спільні геометрії/матеріали.
2. `app/export/page.tsx` (тільки dev): будує групу, експортує `GLTFExporter` (binary) і `USDZExporter`, віддає blob-и.
3. `scripts/export-models.ts`: запускає `next dev` або використовує запущений, відкриває `/export` через Playwright, зберігає `public/models/vial.glb` і `vial.usdz`, друкує розміри і падає, якщо > 1 МБ.
4. `components/ArButton.tsx`: lazy import model-viewer, прихований `<model-viewer src ios-src ar ar-modes="webxr scene-viewer quick-look" ar-placement="floor" ar-scale="fixed">`, перевірка `canActivateAR`, fallback на QR для десктопа, індикатор завантаження на кнопці.
5. Перевірка розмірів: в AR флакон ~9 см (масштаб 1 одиниця = 1 м в експорті).
6. Тест на реальних пристроях: Android Chrome (Scene Viewer), iPhone Safari (Quick Look). Додатково перевірити, що USDZ з `CanvasTexture` експортується з текстурою (відома проблема: текстура має бути з `image`, інколи потрібно конвертувати canvas у `ImageBitmap`/`HTMLImageElement` перед експортом).

Готово, коли: на обох платформах "View in AR" ставить флакон на стіл у натуральну величину з читабельною етикеткою; на десктопі показується QR замість непрацюючої кнопки.

Ризики і запасний план: якщо USDZExporter дає некоректний результат - згенерувати USDZ з GLB через Reality Converter (macOS) або `usd_from_gltf` і закомітити як артефакт; якщо немає Mac - залишити тільки Android AR, на iOS ховати кнопку (критерій SPEC "чесно ховається" дозволяє).

### Фаза 6. Перформанс, доступність, полірування (~3-4 год)

Задачі:
1. Reduced motion: перевірити в DevTools (Rendering -> emulate) і на iPhone (Settings -> Accessibility -> Reduce Motion).
2. Фінальний постер: рендер сцени кадру 1 у 1080x1920 і 1920x1080, конвертація в WebP/AVIF, `<picture>` з media-запитами; вага < 80 КБ.
3. Bundle-аналіз: перевірити, що three/drei/gsap у ленивому чанку, а початковий JS (HTML-шар) мінімальний; загальний JS до AR < 400 КБ gzip.
4. Lighthouse mobile локально (`pnpm build && npx serve out`) і на Pages: Performance 90+, Accessibility 95+. Типові правки: `preload` шрифту, розміри постера, відкладений старт Canvas (`requestIdleCallback`).
5. Обробка `webglcontextlost` (iOS вбиває контекст при перемиканні вкладок): показати постер, відновити сцену при `restored`.
6. Перевірка орієнтації (landscape на телефоні), resize, розмір шрифту 200% у браузері.
7. Тюнінг на слабкому Android (Chrome DevTools CPU throttling 4x + реальний пристрій, якщо є).

Готово, коли: всі цифри з розділу 7 SPEC досягнуті і зафіксовані в README.

### Фаза 7. Тести, CI, README (~2-3 год)

Задачі:
1. `tests/smoke.spec.ts` (Playwright, проекти `Pixel 7` і `iPhone 14` emulation):
   - сторінка відкривається, `h1` видно;
   - `canvas` з'явився протягом 10 с (у CI через SwiftShader - WebGL програмний);
   - немає `console.error` і `pageerror`;
   - скрол до кінця сторінки -> видно кнопки кадру 5;
   - reduced-motion проект: сторінка працює, без помилок;
   - скріншот mobile viewport як артефакт CI.
2. Тест бюджетів: скрипт `scripts/check-budgets.ts` читає `out/` (розмір JS-чанків gzip) і `public/models/` - падає при перевищенні.
3. CI: окремий job `test` перед `deploy`; deploy тільки якщо test зелений. Lighthouse CI (опц.) з порогами як warning, не блокуючи деплой.
4. README англійською: GIF (запис з телефона, 6-8 с, < 3 МБ), посилання на live, QR, стек, розділи "Motion decisions" (плато, easing, чому без bounce), "Performance decisions" (demand frameloop, PerformanceMonitor, lazy AR), "Accessibility", "How the model is built" (lathe-профіль, одне джерело для AR), "Run locally".
5. Опис репо, topics (`threejs`, `react-three-fiber`, `nextjs`, `webgl`, `ar`), social preview зображення.

Готово, коли: CI зелений, README читається за 2 хвилини і пояснює рішення, які Vlad може розповісти на інтерв'ю.

## 4. Структура проєкту (уточнена до SPEC)

```
rx-vial-3d/
  app/
    layout.tsx
    page.tsx                # 5 HTML-секцій + lazy Experience
    globals.css
    export/page.tsx         # тільки dev: експорт GLB/USDZ
  components/
    Experience.tsx          # Canvas, світло, тіні, якість
    CameraRig.tsx           # камера з sceneState
    Vial.tsx
    Box.tsx
    ScrollTimeline.tsx      # GSAP -> sceneState
    Sections.tsx
    ArButton.tsx
    CapColorPicker.tsx
    Poster.tsx              # постер + fade + WebGL fallback
  lib/
    frames.ts               # стани кадрів і таймінги (дані)
    sceneState.ts           # мутабельний стан, який пише GSAP і читає useFrame
    theme.ts
    quality.ts
    materials.ts
    asset.ts
    geometry/vialProfile.ts
    scene/buildVial.ts      # чисті фабрики Three.js (сайт + AR-експорт)
    scene/buildBox.ts
    textures/label.ts
    textures/capNormal.ts
  scripts/
    export-models.ts
    check-budgets.ts
  public/
    models/vial.glb, vial.usdz
    poster-portrait.webp, poster-landscape.webp
    og.png
  tests/
    smoke.spec.ts
  .github/workflows/deploy.yml
  next.config.ts
  playwright.config.ts
  README.md
```

## 5. Git і процес

- Гілка за фазою: `phase-1-scaffold`, `phase-2-scene` тощо, PR у `main`, короткий опис з GIF/скріншотом з телефона. Деплой тільки з `main`.
- Коміти маленькі і змістовні: "Add lathe profile for vial", "Tune frame 3 plateau".
- Після кожної фази - перевірка на iPhone і Android за посиланням з Pages, нотатка в PR, що перевірено.
- Код, який Vlad не може пояснити, не мержиться: кожен PR Vlad читає і може описати своїми словами.

## 6. Ризики і як їх закрити

| Ризик | Ймовірність | Що робимо |
|---|---|---|
| Transmission повільний/артефактний на iOS | висока | старт з `low` на iOS, PerformanceMonitor, подвійна стінка лише в high |
| USDZ без текстури етикетки або з неправильним масштабом | середня | конвертація canvas в image перед експортом; запасний шлях через Reality Converter; у гіршому разі тільки Android AR |
| Конфлікт жестів OrbitControls і скролу | середня | тільки горизонтальне обертання, вмикання при прогресі > 0.97, `touch-action: pan-y` на canvas |
| basePath ламає шляхи до моделей/шрифтів на Pages | висока на старті | `asset()` хелпер, деплой з фази 1, smoke-тест на зібраному `out/` |
| WebGL недоступний у CI для Playwright | середня | `--use-gl=swiftshader`/`--use-angle=swiftshader`, тест не залежить від пікселів сцени |
| Втрата WebGL-контексту на iOS | середня | обробник `webglcontextlost/restored`, постер як fallback |
| Розростання обсягу (ще ефекти, ще кадри) | висока | SPEC - стеля обсягу; нові ідеї у список "після публікації" |

## 7. Чекліст перед відправкою в Bask

- [ ] Live-посилання відкривається на iPhone (Safari) і Android (Chrome), перший текст видно < 2.5 с на 4G.
- [ ] Скрол плавний, 5 кадрів з плато, без мерехтіння і ривків.
- [ ] Unboxing і перемикач кольору працюють, флакон крутиться пальцем у кадрі 5.
- [ ] AR ставить флакон на стіл на обох платформах або чесно ховається.
- [ ] Reduced motion працює; навігація з клавіатури; focus видно.
- [ ] Lighthouse mobile: Performance 90+, Accessibility 95+.
- [ ] Консоль чиста, CI зелений, бюджети в межах.
- [ ] README з GIF, рішеннями щодо руху і перформансу.
- [ ] Vlad пройшов код і може пояснити кожен компонент (особливо `sceneState` + GSAP + `invalidate`).
- [ ] Посилання додано в резюме і cover letter.

## 8. Після публікації (не входить в обсяг v1)

- Варіація під Fiverr: конфігуратор продукту (заміна етикетки завантаженим зображенням).
- Короткий технічний пост у LinkedIn: "How I built a 60 fps scroll-driven product page with R3F" з GIF.
- Оновлення profile.yaml через profile-update: React Three Fiber -> familiar.
