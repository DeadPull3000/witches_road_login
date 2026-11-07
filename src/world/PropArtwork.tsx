import type { ReactNode } from 'react';

const drawings = {
  card: <>
    <path d="M10 52 20 24 88 15l5 38-68 14Z" fill="#241923" opacity=".65" />
    <path d="M9 48 20 20l67-9 4 37-67 13Z" fill="#c19263" stroke="#53382e" strokeWidth="2" />
    <path d="m13 45 9-22 62-8 4 29-62 13Z" fill="#e5c79a" />
    <path d="m29 28 35-5m-37 11 29-4m-31 11 30-5m-34 11 23-4" fill="none" stroke="#8e6650" strokeWidth="2" />
    <path d="m66 32 9-3 6 6-3 8-9 2-5-6Z" fill="#985164" stroke="#f0ab9c" />
    <path d="m72 34 1 7m-4-3 7-1" stroke="#efb095" />
  </>,
  ledger: <>
    <path d="M4 54 20 23l28 3 37-7 12 31-45 17Z" fill="#1f1a20" opacity=".75" />
    <path d="M5 48 20 17l28 4 37-7 10 34-43 14Z" fill="#516044" stroke="#2c2a24" strokeWidth="3" />
    <path d="m9 45 13-25q16-6 28 5l2 32Q33 46 9 45Z" fill="#d3ac78" stroke="#997652" />
    <path d="M50 25q13-15 33-8l10 29q-23-4-41 11Z" fill="#efcea0" stroke="#a37b54" />
    <path d="M22 28q14-2 23 4m-25 2q15 0 25 5m-28 0q17 1 29 7m10-13q13-9 26-6m-25 12q13-8 27-6m-26 12q12-8 29-6" fill="none" stroke="#987150" strokeWidth="1.7" />
    <path d="m51 30 4 31 6-8-3-17" fill="#863c55" />
  </>,
  stamp: <>
    <ellipse cx="52" cy="63" rx="33" ry="8" fill="#21161e" opacity=".64" />
    <path d="M26 49h49l9 7-7 8H23l-7-8Z" fill="#4a292a" stroke="#281d21" strokeWidth="2" />
    <path d="M23 53h56l-5 6H27Z" fill="#ab764e" />
    <path d="M42 43c4-6 6-15 2-20l-5-4h23l-5 4c-4 5-2 14 3 20l10 5H31Z" fill="#a56b3d" stroke="#563624" strokeWidth="2" />
    <path d="M38 11q11-9 25 0l4 7-6 8H42l-7-8Z" fill="#d6a26a" stroke="#563624" strokeWidth="2" />
    <path d="M42 13q9-4 17 0m-13 15q3 7-3 15m-6 6h27" fill="none" stroke="#efc291" strokeWidth="2" />
  </>,
  dateStamp: <>
    <path d="M16 55 78 49l11 10-9 9-58 2-10-9Z" fill="#684234" stroke="#33252a" strokeWidth="2" />
    <path d="m22 55 59-4v9l-58 4Z" fill="#b98557" />
    <path d="M34 25h34l9 24-9 8H29l-7-7Z" fill="#78523d" stroke="#e8b976" strokeWidth="2" />
    <path d="M34 32h34v13H31Z" fill="#d1a470" stroke="#422e28" strokeWidth="2" />
    <path d="M40 34v9m7-9v9m7-9v9m7-9v9" stroke="#866043" />
    <path d="M47 25V13l6-5 7 3 2 6-5 7" fill="#c59457" stroke="#f2c48a" strokeWidth="2" />
  </>,
  slot: <>
    <path d="M8 64V33q2-22 25-24h36q22 2 24 22v33Z" fill="#654332" stroke="#302329" strokeWidth="3" />
    <path d="M15 61V33q0-18 22-19h30q18 1 19 18v29Z" fill="#b9804b" stroke="#e4bb7f" strokeWidth="2" />
    <path d="M23 37h56v17H23Z" fill="#1d161b" stroke="#f0c080" strokeWidth="2" />
    <path d="M30 50h41m-48-23h51" stroke="#8b5c41" strokeWidth="2" />
    <g fill="#f0c792"><circle cx="20" cy="33" r="2" /><circle cx="82" cy="33" r="2" /><circle cx="21" cy="57" r="2" /><circle cx="81" cy="57" r="2" /></g>
  </>,
  door: <>
    <path d="M22 68V30C22 1 77 1 77 30v38Z" fill="#362532" stroke="#261b25" strokeWidth="5" />
    <path d="M26 65V31C26 7 73 7 73 31v34Z" fill="#966548" stroke="#d1a571" strokeWidth="2" />
    <path d="M34 24v40m11-47v47m11-47v47m10-40v40" stroke="#593b35" strokeWidth="2" />
    <path d="m29 36 22-3 4 4-4 4-22 2Zm0 17 21-2 5 4-4 4-22 1Z" fill="#53434a" stroke="#332831" />
    <ellipse cx="64" cy="47" rx="3.6" ry="5.4" fill="none" stroke="#f1bd78" strokeWidth="2" />
    <path d="M17 68h66l4 4H13Z" fill="#65514d" stroke="#30252b" />
  </>,
  knocker: <>
    <path d="m50 7 16 11v42l-16 10-16-10V18Z" fill="#755039" stroke="#35272b" strokeWidth="3" />
    <path d="m50 11 11 8v38l-11 7-11-7V19Z" fill="#b38250" stroke="#ebc28c" />
    <path d="M43 25h14l-4 9h-6Z" fill="#674639" />
    <ellipse cx="50" cy="43" rx="17" ry="18" fill="none" stroke="#38292b" strokeWidth="7" />
    <ellipse cx="50" cy="41" rx="17" ry="18" fill="none" stroke="#e0ac6b" strokeWidth="4" />
    <path d="M35 38q3-11 11-12m6 31q8-2 12-10" stroke="#f7d39b" fill="none" strokeWidth="2" />
  </>,
  television: <>
    <path d="M48 16 34 1m14 15L63 2" stroke="#bda38b" strokeWidth="2.5" />
    <path d="m10 56-3 12h11l5-11m49 0 3 11h12l-5-12" fill="#6c4740" stroke="#321f25" strokeWidth="2" />
    <path d="m11 21 69-5 12 8v32l-9 7-73 1-5-8V29Z" fill="#754e3d" stroke="#30212a" strokeWidth="3" />
    <path d="M10 27 82 22l3 4v29l-6 4-69 1Z" fill="#9a6949" stroke="#cb9462" />
    <path d="M19 29q19-5 41-3l5 4v20l-6 5H20l-6-5V34Z" fill="#5a6461" stroke="#242833" strokeWidth="3" />
    <path d="m23 31 18-1-10 6-11 1Z" fill="#c4cfc1" opacity=".42" />
    <path d="M69 49h10m-10 4h10m-10-8h10" stroke="#513a37" strokeWidth="2" />
    <circle cx="74" cy="36" r="5" fill="#6e5144" stroke="#d4b08a" strokeWidth="2" />
  </>,
  portrait: <>
    <path d="M30 20 50 4l20 16" fill="none" stroke="#b69766" strokeWidth="2" />
    <path d="m32 15 35 1 7 8v35l-8 9-34-1-7-8V25Z" fill="#714a35" stroke="#30232d" strokeWidth="2" />
    <path d="M33 20h33l4 7v31l-6 5H34l-5-6V27Z" fill="#58405b" stroke="#e0b777" strokeWidth="2" />
    <path d="M36 57q1-12 11-15c-8-10-3-20 6-19 9 1 11 11 3 19q11 4 10 15Z" fill="#c69484" />
    <path d="M47 43q-8-4-8-13 4-11 13-10 11 2 10 14l-3 10-4-6q4-7 0-12l-7 3-2 9Z" fill="#392b3d" />
  </>,
  mushrooms: <>
    <ellipse cx="51" cy="61" rx="39" ry="8" fill="#1c2632" opacity=".7" />
    <path d="m26 36 12 1 1 23H23Zm33 7 10 1 4 17H57Zm19 7 7 1 2 13H76Z" fill="#9ab19a" stroke="#364b46" strokeWidth="2" />
    <path d="M8 37q4-22 25-22 17 0 23 22l-8 6H16Z" fill="#7bb4a3" stroke="#324d52" strokeWidth="2" />
    <path d="M46 45q3-17 18-17 14 1 18 18l-6 5H52Zm26 8q2-11 10-11 10 1 13 12l-6 5H78Z" fill="#679891" stroke="#324d52" strokeWidth="2" />
    <path d="M15 35q12-11 29-2m7 9q11-7 22 0m4 9 11-2" fill="none" stroke="#bad4b5" strokeWidth="2" />
    <path d="M29 23h6m4 6h4m18 6h5" stroke="#e6e2bb" strokeWidth="3" />
  </>,
  scroll: <>
    <path d="M18 59 30 19l57-7-5 43-11 9Z" fill="#241923" opacity=".65" />
    <path d="M16 54q14-7 14-32l44-7q7-1 8 6l-6 28q0 10-11 13Z" fill="#e8c895" stroke="#8c6041" strokeWidth="2" />
    <path d="M26 24q2-12 13-12l42 1q8 2 6 10l-7 1q2-5-4-6l-39 1q-5 0-5 6Z" fill="#b8875a" stroke="#573b31" strokeWidth="2" />
    <path d="m39 30 29-2m-31 9 32-1m-34 9h26" fill="none" stroke="#a37756" strokeWidth="2" />
    <path d="M16 53q10-5 12 3l38 1q4 0 7-4-2 10-8 11H25q-11-1-9-11Z" fill="#bd9061" stroke="#644334" strokeWidth="2" />
  </>,
  key: <>
    <path d="M28 54 68 28m-4 4 8 8 6-4-6-9 9-4-5-7-54 33Z" fill="#553934" stroke="#38272c" strokeWidth="3" />
    <path d="m27 49 44-29 9 1-1 5-9 4 6 8-5 3-7-9-29 23Z" fill="#bb894f" stroke="#e5bd7c" strokeWidth="2" />
    <path d="m27 37 13 6v14l-10 10-15-5-4-14 8-11Z" fill="#996842" stroke="#e1b272" strokeWidth="2.5" />
    <path d="m24 45 8 4v6l-6 4-7-3-1-7Z" fill="#322630" stroke="#714c3b" strokeWidth="2" />
  </>,
  dial: <>
    <ellipse cx="50" cy="61" rx="33" ry="8" fill="#2a1c26" />
    <path d="M23 41h54l12 16-10 9H21l-9-9Z" fill="#987050" stroke="#463332" strokeWidth="2" />
    <circle cx="50" cy="37" r="24" fill="#5a4239" stroke="#ebc590" strokeWidth="3" />
    <circle cx="50" cy="37" r="16" fill="#cca77d" stroke="#3f302f" strokeWidth="2" />
    <g fill="#503b37">{Array.from({ length: 8 }, (_, i) => <circle key={i} cx={50 + Math.cos(i * Math.PI / 4) * 11} cy={37 + Math.sin(i * Math.PI / 4) * 11} r="2.7" />)}</g>
    <path d="M41 37h18" stroke="#e2bc85" strokeWidth="2" />
  </>,
  musicBox: <>
    <path d="M13 37 67 25l23 16v20L37 73 13 57Z" fill="#674036" stroke="#30212b" strokeWidth="2.5" />
    <path d="m13 37 54-12 23 16-53 14Z" fill="#ad774d" stroke="#d9a36c" strokeWidth="2" />
    <path d="M37 55v17m6-14 39-9m-40 16 39-9" fill="none" stroke="#d0a070" strokeWidth="2" />
    <path d="m15 36 2-18 50-12 5 19-50 14Z" fill="#926448" stroke="#4c3331" strokeWidth="2" />
    <path d="m23 20 37-8 4 10-37 9Z" fill="#5e454d" stroke="#d5a774" />
    <path d="m31 39 23-7 12 7-23 6Z" fill="#efd1a1" stroke="#765844" strokeWidth="2" />
    <path d="m87 51 9-3v-9" fill="none" stroke="#dcb077" strokeWidth="3" /><circle cx="96" cy="38" r="3" fill="#f1cb8e" />
  </>,
  spool: <>
    <path d="m22 61 52-10 9 7-15 10-43 1Z" fill="#221925" opacity=".7" />
    <path d="m34 23 29-4 11 33-31 9Z" fill="#9a728e" stroke="#4f374b" strokeWidth="2.5" />
    <path d="m36 31 29-5m-27 11 29-6m-27 12 29-7m-27 13 29-8m-27 13 29-8" stroke="#e2abc0" strokeWidth="2" />
    <path d="m29 17 35-8 9 8-4 8-35 7-8-7Zm8 37 35-9 10 7-4 9-36 9-9-8Z" fill="#ad7d55" stroke="#55382e" strokeWidth="2" />
    <path d="m27 24 38-9m-27 47 39-10m-9-16q21 1 19 17l7 10" fill="none" stroke="#e9ba8f" strokeWidth="2" />
  </>,
  hourglass: <>
    <path d="M32 15h36v12q-2 11-13 15 11 4 13 17v6H32v-6q2-13 13-17-11-4-13-15Z" fill="#5b5360" stroke="#d6b28a" strokeWidth="2" />
    <path d="m37 27 26-3q-2 10-13 16-12-3-13-13Zm0 32q7-11 13-12 6 2 13 12Z" fill="#d2a774" />
    <path d="M50 40v12" stroke="#d2a774" />
    <path d="M23 11h54v9H23Zm0 51h54v9H23Z" fill="#80513f" stroke="#e1b279" strokeWidth="2" />
  </>,
  intercom: <>
    <path d="M21 43 65 37l18 21-5 12H23l-9-10Z" fill="#66676a" stroke="#303237" strokeWidth="3" />
    <path d="M24 44h39l12 13H18Z" fill="#99969b" />
    <path d="M37 44h24m-26 4h29m-33 4h34" stroke="#424348" strokeWidth="2" />
    <path d="M42 40V18m0 12L25 48" stroke="#b9bac0" strokeWidth="3" />
    <ellipse cx="43" cy="18" rx="13" ry="9" fill="#87888a" stroke="#dedadc" strokeWidth="2" />
    <path d="M35 15h16m-18 4h19m-15 4h12" stroke="#4a494e" strokeWidth="2" />
    <circle cx="68" cy="61" r="4" fill="#e6be7f" />
  </>,
  cards: <>
    <path d="m22 22 43-9 10 47-42 9Z" fill="#6c4863" stroke="#302131" strokeWidth="3" />
    <path d="m37 13 42 4-5 48-43-4Z" fill="#dfbd8e" stroke="#493236" strokeWidth="2" />
    <path d="m43 18 30 4-4 36-32-2Z" fill="#9a7177" stroke="#edcca5" />
    <path d="m56 29 3 8 8 3-8 3-4 9-3-9-8-4 8-2Z" fill="#edd1a0" />
  </>,
} satisfies Record<string, ReactNode>;

export type PropKind = keyof typeof drawings;

export function PropArtwork({ kind }: { kind: PropKind }) {
  return <svg className="prop-artwork" data-prop-kind={kind} viewBox="0 0 100 76" aria-hidden="true" focusable="false">{drawings[kind]}</svg>;
}
