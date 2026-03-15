import { useState } from "react";

/* ═══════════════════════ SCALE LABEL CONSTANTS ═══════════════════════════ */
const SCALE_AGREE = [
  "Совершенно\nне согласен(а)",
  "Скорее\nне согласен(а)",
  "Не\nуверен(а)",
  "Скорее\nсогласен(а)",
  "Совершенно\nсогласен(а)",
];
const SCALE_COMFORT = [
  "Очень\nнекомфортно",
  "Скорее\nнекомфортно",
  "Не\nуверен(а)",
  "Скорее\nкомфортно",
  "Очень\nкомфортно",
];
const SCALE_THREAT = [
  "Почти или\nсовсем нет",
  "Немного",
  "Умеренно",
  "Значительно",
  "Очень\nсильно",
];
const SCALE_FREQ = [
  "Никогда",
  "Иногда",
  "Время от\nвремени",
  "Часто",
  "Постоянно или\nпочти постоянно",
];
const SCALE_NET = [
  "Никто или\nпочти никто",
  "Меньше\nполовины",
  "Около\nполовины",
  "Больше\nполовины",
  "Все или\nпочти все",
];

const EDUCATION_OPTS = [
  "Неполное среднее",
  "Среднее (школа, ПТУ)",
  "Среднее специальное (колледж, техникум)",
  "Незаконченное высшее",
  "Высшее (бакалавр, специалист)",
  "Два и более высших / учёная степень",
];
const INCOME_OPTS = [
  "Денег не хватает даже на еду",
  "Денег хватает только на еду",
  "Денег хватает на еду и одежду, но не на крупные покупки",
  "Денег хватает на большинство необходимых покупок",
  "Можем позволить себе практически всё",
];

/* ════════════════════════ HELPER FUNCTIONS ══════════════════════════════ */
function computeIngroup(dir) {
  return dir <= 2 ? "disapprove" : "approve";
}

function getGroupText(ingroup) {
  if (ingroup === "disapprove") {
    return {
      inTxt: "людей, которые считают, что дела в России идут в неправильном направлении",
      outTxt: "людей, которые считают, что дела в России идут в правильном направлении",
      outDir: "правильном",
    };
  }
  return {
    inTxt: "людей, которые считают, что дела в России идут в правильном направлении",
    outTxt: "людей, которые считают, что дела в России идут в неправильном направлении",
    outDir: "неправильном",
  };
}

/* ═════════════════════════ UI PRIMITIVES ════════════════════════════════ */

function BodyText({ children, style }) {
  return (
    <div
      style={{
        fontSize: 14,
        lineHeight: 1.85,
        color: "#3a3228",
        marginBottom: 20,
        fontFamily: "Georgia, serif",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function QLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: "#2a2520",
        marginBottom: 10,
        lineHeight: 1.55,
        fontFamily: "Georgia, serif",
      }}
    >
      {children}
    </div>
  );
}

function QBlock({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <QLabel>{label}</QLabel>
      {children}
    </div>
  );
}

function RadioOption({ label, checked, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 9,
        cursor: "pointer",
        fontSize: 13.5,
        color: "#2a2520",
        lineHeight: 1.5,
        fontFamily: "Georgia, serif",
      }}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        style={{
          accentColor: "#2d5a8c",
          width: 16,
          height: 16,
          cursor: "pointer",
          flexShrink: 0,
          marginTop: 2,
        }}
      />
      {label}
    </label>
  );
}

/* Matrix: column headers + item rows sharing one scale */
function SurveyMatrix({ items, scale, values, onChange, uid }) {
  return (
    <div>
      {/* Column header row */}
      <div style={{ display: "flex", gap: 0, paddingLeft: "36%", marginBottom: 2 }}>
        {scale.map((lbl, ci) => (
          <div
            key={ci}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 9.5,
              color: "#999",
              lineHeight: 1.3,
              whiteSpace: "pre-line",
              padding: "0 1px",
            }}
          >
            {lbl}
          </div>
        ))}
      </div>
      {/* Item rows */}
      {items.map((item, ri) => (
        <div
          key={ri}
          style={{
            display: "flex",
            alignItems: "center",
            borderTop: "1px solid #eeece8",
            padding: "10px 0",
          }}
        >
          <div
            style={{
              width: "36%",
              paddingRight: 12,
              fontSize: 13,
              color: "#2a2520",
              lineHeight: 1.55,
              fontFamily: "Georgia, serif",
            }}
          >
            {item}
          </div>
          <div style={{ flex: 1, display: "flex" }}>
            {scale.map((_, ci) => (
              <label
                key={ci}
                style={{ flex: 1, display: "flex", justifyContent: "center", cursor: "pointer" }}
              >
                <input
                  type="radio"
                  name={`${uid}_r${ri}`}
                  checked={values[ri] === ci + 1}
                  onChange={() => onChange(ri, ci + 1)}
                  style={{ accentColor: "#2d5a8c", width: 16, height: 16, cursor: "pointer" }}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Single-item horizontal scale with labels below each button */
function RadioScale({ scale, value, onChange, name }) {
  return (
    <div style={{ display: "flex", gap: 0 }}>
      {scale.map((lbl, i) => (
        <label
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            padding: "4px 2px",
          }}
        >
          <input
            type="radio"
            name={name}
            checked={value === i + 1}
            onChange={() => onChange(i + 1)}
            style={{ accentColor: "#2d5a8c", width: 17, height: 17, cursor: "pointer" }}
          />
          <span
            style={{
              fontSize: 10,
              color: "#888",
              textAlign: "center",
              lineHeight: 1.3,
              whiteSpace: "pre-line",
            }}
          >
            {lbl}
          </span>
        </label>
      ))}
    </div>
  );
}

/* Semantic differential: left label — radio dots — right label */
function SemanticDiff({ leftLabel, rightLabel, n, value, onChange, name }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
        justifyContent: "center",
        margin: "12px 0 4px",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#3a3228",
          lineHeight: 1.45,
          textAlign: "right",
          maxWidth: 210,
          flex: "0 1 210px",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
        }}
      >
        {leftLabel}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
        {Array.from({ length: n }, (_, i) => (
          <label
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name={name}
              checked={value === i + 1}
              onChange={() => onChange(i + 1)}
              style={{ accentColor: "#2d5a8c", width: 20, height: 20, cursor: "pointer" }}
            />
            <span style={{ fontSize: 11, color: "#bbb" }}>{i + 1}</span>
          </label>
        ))}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#3a3228",
          lineHeight: 1.45,
          textAlign: "left",
          maxWidth: 210,
          flex: "0 1 210px",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
        }}
      >
        {rightLabel}
      </div>
    </div>
  );
}

/* ════════════════════════ MAIN SURVEY COMPONENT ═════════════════════════ */
export default function Survey({ type, onComplete }) {
  const isPre = type === "pre";
  /* pre: screens 0–9 (10 total), post: screens 0–8 (9 total) */
  const TOTAL = isPre ? 10 : 9;

  const [screen, setScreen] = useState(0);
  const [ans, setAns] = useState({
    gender: null,
    age: "",
    education: null,
    income: null,
    direction: null,
    ingroupId: [null, null, null],
    outgroupTraits: [null, null, null, null, null, null],
    affect: null,
    socialDist: [null, null, null, null],
    threat: [null, null, null, null],
    contactFreq: null,
    networkComp: [null, null, null, null],
  });

  function setVal(key, val) {
    setAns(a => ({ ...a, [key]: val }));
  }
  function setArr(key, idx, val) {
    setAns(a => ({ ...a, [key]: a[key].map((v, i) => (i === idx ? val : v)) }));
  }

  /* Derived state */
  const ingroup = ans.direction !== null ? computeIngroup(ans.direction) : null;
  const gt = ingroup ? getGroupText(ingroup) : { inTxt: "…", outTxt: "…", outDir: "…" };

  /* ── Screen indices per survey type ─────────────────────────── */
  const IDX = isPre
    ? { welcome: 0, demo: 1, dir: 2, ingId: 3, outTr: 4, affect: 5, socDist: 6, threat: 7, contact: 8, final: 9 }
    : { welcome: 0,           dir: 1, ingId: 2, outTr: 3, affect: 4, socDist: 5, threat: 6, contact: 7, final: 8 };

  /* ── Validation ──────────────────────────────────────────────── */
  function isComplete() {
    switch (screen) {
      case IDX.welcome: return true;
      case IDX.dir:     return ans.direction !== null;
      case IDX.ingId:   return ans.ingroupId.every(v => v !== null);
      case IDX.outTr:   return ans.outgroupTraits.every(v => v !== null);
      case IDX.affect:  return ans.affect !== null;
      case IDX.socDist: return ans.socialDist.every(v => v !== null);
      case IDX.threat:  return ans.threat.every(v => v !== null);
      case IDX.contact: return ans.contactFreq !== null && ans.networkComp.every(v => v !== null);
      case IDX.final:   return true;
      default:
        if (isPre && screen === IDX.demo) {
          const n = parseInt(ans.age, 10);
          return (
            ans.gender !== null &&
            !isNaN(n) && n >= 18 && n <= 99 &&
            ans.education !== null &&
            ans.income !== null
          );
        }
        return true;
    }
  }

  /* ── Next / complete ─────────────────────────────────────────── */
  function handleNext() {
    if (screen < TOTAL - 1) {
      setScreen(s => s + 1);
      return;
    }
    const ageN = parseInt(ans.age, 10);
    onComplete({
      direction: ans.direction,
      ingroup,
      ingroup_id: [...ans.ingroupId],
      outgroup_traits: [...ans.outgroupTraits],
      affect_thermometer: ans.affect,
      social_distance: [...ans.socialDist],
      perceived_threat: [...ans.threat],
      contact_frequency: ans.contactFreq,
      network_composition: [...ans.networkComp],
      ...(isPre ? { gender: ans.gender, age: ageN, education: ans.education, income: ans.income } : {}),
    });
  }

  const complete = isComplete();
  const progress = TOTAL > 1 ? (screen / (TOTAL - 1)) * 100 : 100;
  const isFinal = screen === IDX.final;
  const btnLabel = isFinal ? (isPre ? "Начать игру →" : "Завершить →") : "Далее →";

  /* ── Screen titles ───────────────────────────────────────────── */
  const TITLES = {
    [IDX.welcome]: isPre ? "Добро пожаловать" : "Послеигровой опрос",
    [IDX.dir]:     "Ваша позиция",
    [IDX.ingId]:   "Отношение к группе",
    [IDX.outTr]:   "Качества группы",
    [IDX.affect]:  "Ваше отношение",
    [IDX.socDist]: "Социальные ситуации",
    [IDX.threat]:  "Восприятие угрозы",
    [IDX.contact]: "Ваше окружение",
    [IDX.final]:   "",
  };
  if (isPre) TITLES[IDX.demo] = "О вас";

  /* ── Screen content ──────────────────────────────────────────── */
  function renderScreen() {
    /* Welcome */
    if (screen === IDX.welcome) {
      if (isPre) {
        return (
          <>
            <BodyText>
              Спасибо, что заинтересовались нашим исследованием. Мы, группа
              исследователей из Высшей школы экономики, изучаем представления
              людей о себе и о мире, в котором они живут. Если вы живёте в
              России, мы просим вас ответить на несколько вопросов. Это займёт
              около 20 минут.
            </BodyText>
            <BodyText>
              Ответы на вопросы не подразделяются на «правильные» и
              «неправильные». Будьте уверены: какой бы ответ вы не выбрали,
              найдутся люди, которые ответят по-другому. Поэтому лучший
              ответ — это ваше личное мнение.
            </BodyText>
            <BodyText>
              Исследование полностью анонимно: вам не понадобится указывать
              своё имя, место жительства и другие персональные данные. Кроме
              того, в любой момент вы можете отказаться от участия. Ваши ответы
              будут использоваться только в обобщённом виде и только в научных
              целях.
            </BodyText>
            <BodyText style={{ fontWeight: 600 }}>Благодарим вас за участие!</BodyText>
          </>
        );
      }
      return (
        <>
          <BodyText>
            Игра завершена. Пожалуйста, ответьте ещё на несколько вопросов —
            это займёт около 5 минут.
          </BodyText>
        </>
      );
    }

    /* Demographics (pre only) */
    if (isPre && screen === IDX.demo) {
      return (
        <>
          <QBlock label="Ваш пол">
            {["Мужской", "Женский", "Предпочитаю не указывать"].map(opt => (
              <RadioOption
                key={opt}
                label={opt}
                checked={ans.gender === opt}
                onChange={() => setVal("gender", opt)}
              />
            ))}
          </QBlock>

          <QBlock label="Ваш возраст">
            <input
              type="number"
              min={18}
              max={99}
              value={ans.age}
              onChange={e => setVal("age", e.target.value)}
              placeholder="Введите возраст (18–99)"
              style={{
                border: "1px solid #ddd8d0",
                borderRadius: 6,
                padding: "9px 14px",
                fontSize: 14,
                color: "#1a1410",
                width: "100%",
                boxSizing: "border-box",
                fontFamily: "Georgia, serif",
                background: "#fefcf8",
                outline: "none",
              }}
            />
          </QBlock>

          <QBlock label="Ваш уровень образования">
            {EDUCATION_OPTS.map(opt => (
              <RadioOption
                key={opt}
                label={opt}
                checked={ans.education === opt}
                onChange={() => setVal("education", opt)}
              />
            ))}
          </QBlock>

          <QBlock label="Оцените материальное положение вашей семьи">
            {INCOME_OPTS.map(opt => (
              <RadioOption
                key={opt}
                label={opt}
                checked={ans.income === opt}
                onChange={() => setVal("income", opt)}
              />
            ))}
          </QBlock>
        </>
      );
    }

    /* Direction question */
    if (screen === IDX.dir) {
      return (
        <>
          <BodyText>
            Люди придерживаются разных позиций относительно того, что
            происходит в нашей стране. Одни считают, что дела в России идут в
            правильном направлении, а другие полагают, что в неправильном.
            Какой позиции придерживаетесь Вы?
          </BodyText>
          <SemanticDiff
            leftLabel="Дела в России идут в неправильном направлении"
            rightLabel="Дела в России идут в правильном направлении"
            n={5}
            value={ans.direction}
            onChange={v => setVal("direction", v)}
            name={`${type}_direction`}
          />
        </>
      );
    }

    /* Ingroup identification */
    if (screen === IDX.ingId) {
      return (
        <>
          <BodyText style={{ marginBottom: 16 }}>
            Перед вами несколько утверждений об отношении к {gt.inTxt}.
          </BodyText>
          <SurveyMatrix
            items={[
              `Я горжусь тем, что принадлежу к числу ${gt.inTxt}`,
              `Мне важно быть частью ${gt.inTxt}`,
              `Я ощущаю психологическую связь с ${gt.inTxt}`,
            ]}
            scale={SCALE_AGREE}
            values={ans.ingroupId}
            onChange={(ri, v) => setArr("ingroupId", ri, v)}
            uid={`${type}_ing`}
          />
        </>
      );
    }

    /* Outgroup traits */
    if (screen === IDX.outTr) {
      return (
        <>
          <BodyText style={{ marginBottom: 16 }}>
            Ниже приведён список личностных качеств. Насколько вы согласны или
            не согласны с тем, что эти особенности свойственны {gt.outTxt}?
          </BodyText>
          <SurveyMatrix
            items={[
              "Умные",
              "Отзывчивые",
              "Тщательно анализируют информацию",
              "Склонные к помощи",
              "Честные",
              "Открытые к новым идеям",
            ]}
            scale={SCALE_AGREE}
            values={ans.outgroupTraits}
            onChange={(ri, v) => setArr("outgroupTraits", ri, v)}
            uid={`${type}_out`}
          />
        </>
      );
    }

    /* Affect thermometer */
    if (screen === IDX.affect) {
      return (
        <>
          <BodyText style={{ marginBottom: 20 }}>
            Как бы вы оценили своё отношение к {gt.outTxt}?
          </BodyText>
          <SemanticDiff
            leftLabel="Отношение очень холодное, отрицательное"
            rightLabel="Отношение очень тёплое, положительное"
            n={7}
            value={ans.affect}
            onChange={v => setVal("affect", v)}
            name={`${type}_affect`}
          />
        </>
      );
    }

    /* Social distance */
    if (screen === IDX.socDist) {
      return (
        <>
          <BodyText style={{ marginBottom: 16 }}>
            Представьте, что перед вами человек, который считает, что дела в
            России идут в {gt.outDir} направлении. Пожалуйста, оцените, как вы
            будете чувствовать себя при общении с ним, если он будет...
          </BodyText>
          <SurveyMatrix
            items={[
              "Вашим соседом",
              "Вашим другом",
              "Вашим коллегой",
              "Членом вашей семьи",
            ]}
            scale={SCALE_COMFORT}
            values={ans.socialDist}
            onChange={(ri, v) => setArr("socialDist", ri, v)}
            uid={`${type}_sd`}
          />
        </>
      );
    }

    /* Perceived threat */
    if (screen === IDX.threat) {
      return (
        <>
          <BodyText style={{ marginBottom: 16 }}>
            Как вам кажется, насколько {gt.outTxt} угрожают...
          </BodyText>
          <SurveyMatrix
            items={[
              "Распространённым среди россиян ценностям",
              "Материальному благополучию россиян",
              "Физической безопасности россиян",
              "Привычному для россиян образу жизни",
            ]}
            scale={SCALE_THREAT}
            values={ans.threat}
            onChange={(ri, v) => setArr("threat", ri, v)}
            uid={`${type}_thr`}
          />
        </>
      );
    }

    /* Intergroup contact */
    if (screen === IDX.contact) {
      return (
        <>
          <BodyText>
            Перед вами вопрос об отношении вашего окружения к происходящему в
            стране.
          </BodyText>
          <QLabel>Как часто вы общаетесь с {gt.outTxt}?</QLabel>
          <div style={{ marginBottom: 28 }}>
            <RadioScale
              scale={SCALE_FREQ}
              value={ans.contactFreq}
              onChange={v => setVal("contactFreq", v)}
              name={`${type}_cf`}
            />
          </div>

          <BodyText>
            Перед вами несколько вопросов об отношении вашего окружения к
            происходящему в стране.
          </BodyText>
          <SurveyMatrix
            items={[
              `Сколько людей, с которыми вы общаетесь в социальных сетях, считают, что дела в России идут в ${gt.outDir} направлении?`,
              `Сколько людей, с которыми вы регулярно общаетесь (на работе, в университете, по соседству и т.д.), считают, что дела в России идут в ${gt.outDir} направлении?`,
              `Сколько ваших родственников (включая родителей, братьев, сестёр, бабушек, дедушек и т.д.) считают, что дела в России идут в ${gt.outDir} направлении?`,
              `Сколько ваших друзей считают, что дела в России идут в ${gt.outDir} направлении?`,
            ]}
            scale={SCALE_NET}
            values={ans.networkComp}
            onChange={(ri, v) => setArr("networkComp", ri, v)}
            uid={`${type}_nc`}
          />
        </>
      );
    }

    /* Final screen */
    if (screen === IDX.final) {
      return (
        <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
          <div style={{ fontSize: 44, marginBottom: 20 }}>{isPre ? "🎮" : "🙏"}</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#1a1410",
              marginBottom: 16,
              fontFamily: "Georgia, serif",
              lineHeight: 1.4,
            }}
          >
            {isPre ? "Спасибо за ответы!" : "Большое спасибо за участие в исследовании!"}
          </div>
          {isPre && (
            <BodyText style={{ textAlign: "center" }}>
              Теперь вас ждёт игра. Нажмите «Начать игру», чтобы продолжить.
            </BodyText>
          )}
        </div>
      );
    }

    return null;
  }

  const title = TITLES[screen];

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,4,2,0.97)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 1500,
        backdropFilter: "blur(8px)",
        overflowY: "auto",
        padding: "32px 16px 48px",
      }}
    >
      <div
        style={{
          background: "#faf8f4",
          borderRadius: 12,
          padding: "44px 48px",
          width: "100%",
          maxWidth: 700,
          color: "#1a1410",
          fontFamily: "Georgia, serif",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
          animation: "scaleIn 0.25s ease",
          boxSizing: "border-box",
          marginBottom: 32,
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 4, background: "#e8e4de", borderRadius: 2, marginBottom: 6 }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg,#1a3a5c,#4a8ac4)",
              borderRadius: 2,
              width: `${progress}%`,
              transition: "width 0.35s ease",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#b0a898",
            marginBottom: 28,
            fontFamily: "Georgia, serif",
            letterSpacing: 0.3,
          }}
        >
          Шаг {screen + 1} из {TOTAL}
        </div>

        {/* Screen title */}
        {title && (
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1a1410",
              marginBottom: 22,
              letterSpacing: 0.3,
              fontFamily: "Georgia, serif",
              borderBottom: "2px solid #e8e4de",
              paddingBottom: 14,
            }}
          >
            {title}
          </div>
        )}

        {/* Content */}
        {renderScreen()}

        {/* Navigation */}
        <div style={{ marginTop: 34, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleNext}
            disabled={!complete}
            style={{
              background: complete
                ? "linear-gradient(135deg,#1a3a5c,#2d6496)"
                : "#e0dcd6",
              color: complete ? "#fff" : "#b0a898",
              border: "none",
              borderRadius: 8,
              padding: "13px 46px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.5,
              cursor: complete ? "pointer" : "default",
              fontFamily: "Georgia, serif",
              boxShadow: complete ? "0 4px 20px rgba(45,100,150,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
